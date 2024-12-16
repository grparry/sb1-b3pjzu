import { handlers } from './handlers';
import { getConfig } from '../services/config';
import { logger } from '../services/utils/logging';

// Helper to create JSON response with proper headers
const createResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, x-msw-bypass'
    }
  });
};

// Setup request interception without using MSW
export async function setupRequestInterception() {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.origin);
    
    // Log request if enabled
    const { logNetworkTraffic } = getConfig();
    if (logNetworkTraffic) {
      logger.debug('Request intercepted', { 
        method: request.method, 
        pathname: url.pathname,
        headers: Object.fromEntries(request.headers.entries())
      });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, x-msw-bypass'
        }
      });
    }

    // Find matching handler
    for (const handler of handlers) {
      const match = handler.test(url.pathname, request);
      if (match) {
        try {
          if (logNetworkTraffic) {
            logger.debug('Handler matched', { handler: handler.name });
          }
          const response = await handler.resolver(request, match);
          return response;
        } catch (error) {
          logger.error('Handler error', error);
          return createResponse(
            { message: error.message || 'Internal server error' },
            error.status || 500
          );
        }
      }
    }

    // No handler found, pass through to original fetch
    if (logNetworkTraffic) {
      logger.debug('No handler found, passing through');
    }
    return originalFetch(input, init);
  };

  logger.info('Request interception initialized');
  return true;
}
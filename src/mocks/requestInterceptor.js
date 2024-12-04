import { handlers } from './handlers';
import { getConfig } from '../services/config';

// Helper to create JSON response with proper headers
const createResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
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
      console.debug('Request intercepted:', request.method, url.pathname);
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept'
        }
      });
    }

    // Find matching handler
    for (const handler of handlers) {
      const match = handler.test(url.pathname, request);
      if (match) {
        try {
          if (logNetworkTraffic) {
            console.debug('Handler matched:', handler.name);
          }
          const response = await handler.resolver(request, match);
          return response;
        } catch (error) {
          console.error('Handler error:', error);
          return createResponse(
            { message: error.message || 'Internal server error' },
            error.status || 500
          );
        }
      }
    }

    // No handler found, pass through to original fetch
    if (logNetworkTraffic) {
      console.debug('No handler found, passing through');
    }
    return originalFetch(input, init);
  };

  console.log('Request interception initialized');
  return true;
}
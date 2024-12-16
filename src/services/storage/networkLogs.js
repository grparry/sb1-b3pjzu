import { putInStore } from './dataStore';
import { logger } from '../utils/logging';
import { clearStore } from './dataStore';
import { generateMockKey } from './mockResponses';

// Helper to ensure we have an absolute URL
function ensureAbsoluteUrl(url) {
  logger.info('Ensuring absolute URL for:', url);
  if (!url) {
    logger.info('No URL provided, using default');
    return new URL('/', window.location.origin);
  }
  try {
    const absoluteUrl = new URL(url);
    logger.info('Created absolute URL:', absoluteUrl.href);
    return absoluteUrl;
  } catch (e) {
    logger.info('Failed to create URL directly, using window.location.origin');
    // If URL construction fails, it's likely a relative path
    const absoluteUrl = new URL(url, window.location.origin);
    logger.info('Created absolute URL with origin:', absoluteUrl.href);
    return absoluteUrl;
  }
}

// Helper to ensure we have valid mock entry values
function ensureValidMockEntry(operation) {
  logger.info('Creating mock entry from operation:', operation);
  
  const url = ensureAbsoluteUrl(operation.url);
  const method = operation.method || 'GET';
  const pathname = url.pathname || '/';
  const id = generateMockKey(method, pathname);
  
  const result = {
    url: url.href,
    method,
    pathname,
    id
  };
  
  logger.info('Generated mock entry values:', result);
  return result;
}

/**
 * Log a network operation (request or response)
 * @param {Object} entry 
 * @returns {Promise<Object>}
 */
export async function logNetwork(entry) {
  try {
    // Add timestamp and unique ID if not present
    const networkEntry = {
      id: entry.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry
    };

    // Store in network store
    await putInStore('network', networkEntry);
    logger.info('Logged network entry', networkEntry);

    // If this is a successful response and we're capturing responses, store in mockResponses
    if (entry.type === 'success' && entry.operation?.type === 'response') {
      logger.info('Processing successful response for mock storage');
      const { captureResponses } = await import('../config').then(m => m.default.getState());
      if (captureResponses && entry.operation.response) {
        logger.info('Creating mock response with operation', entry.operation);
        const validValues = ensureValidMockEntry(entry.operation);
        const mockEntry = {
          id: validValues.id,
          timestamp: networkEntry.timestamp,
          url: validValues.url,
          method: validValues.method,
          pathname: validValues.pathname,
          status: entry.operation.status,
          headers: entry.operation.headers,
          response: entry.operation.response,
          captured: true
        };
        
        try {
          logger.info('Attempting to store mock entry', mockEntry);
          await putInStore('mockResponses', mockEntry);
          logger.info('Successfully stored mock response');
        } catch (error) {
          // If we get a DataError, try resetting the database
          if (error.name === 'DataError') {
            logger.info('Got DataError, attempting database reset');
            await import('./core').then(m => m.resetDatabase());
            // Try storing again
            await putInStore('mockResponses', mockEntry);
            logger.info('Successfully stored mock response after database reset');
          } else {
            throw error;
          }
        }
      }
    }

    return networkEntry;
  } catch (error) {
    logger.error('Failed to log network entry', error);
    return null;
  }
}

/**
 * Clear all network logs
 * @returns {Promise<void>}
 */
export async function clearNetwork() {
  return clearStore('network');
}

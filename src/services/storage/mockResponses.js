import { putInStore, getFromStore, clearStore } from './dataStore';
import { logger } from '../utils/logging';

/**
 * Generate a stable key for mock responses
 * @param {string} method 
 * @param {string} pathname 
 * @param {Object} data 
 * @returns {string}
 */
export function generateMockKey(method, pathname, data) {
  if (!method || !pathname) {
    logger.error('Invalid input for generateMockKey:', { method, pathname });
    throw new Error('Method and pathname are required for mock key generation');
  }

  // For media folders, use the folder name as the key
  if (pathname.includes('/api/studio/media/folders') && data?.name) {
    logger.info('Using folder name as mock key:', data.name);
    return data.name;
  }

  // For other cases, generate a unique key by including timestamp
  const timestamp = new Date().getTime();
  const key = `${method.toUpperCase()}-${pathname}-${timestamp}`;
  logger.info('Generated mock key:', { method, pathname, key });
  return key;
}

/**
 * Compare two mock responses
 * @param {Object} existing 
 * @param {Object} captured 
 * @returns {boolean}
 */
export function compareMockResponses(existing, captured) {
  if (!existing || !captured) return false;
  
  // Compare basic properties
  const basicProps = ['method', 'url', 'status'];
  for (const prop of basicProps) {
    if (existing[prop] !== captured[prop]) return false;
  }
  
  // Compare headers (if they exist)
  if (existing.headers && captured.headers) {
    const existingHeaders = new Set(Object.entries(existing.headers).map(([k, v]) => `${k}:${v}`));
    const capturedHeaders = new Set(Object.entries(captured.headers).map(([k, v]) => `${k}:${v}`));
    if (existingHeaders.size !== capturedHeaders.size) return false;
    for (const header of existingHeaders) {
      if (!capturedHeaders.has(header)) return false;
    }
  }
  
  // Compare response data
  return JSON.stringify(existing.response) === JSON.stringify(captured.response);
}

/**
 * Store a mock response
 * @param {Object} request 
 * @param {Object} response 
 * @param {Object} responseData 
 * @returns {Promise<Object>}
 */
export async function storeMockResponse(request, response, responseData) {
  try {
    const url = new URL(request.url);
    let requestData = null;
    
    // Extract request data for POST/PUT requests
    if (request.method === 'POST' || request.method === 'PUT') {
      try {
        requestData = await request.clone().json();
      } catch (e) {
        logger.error('Failed to parse request data:', e);
      }
    }
    
    const mockKey = generateMockKey(request.method, url.pathname, requestData);
    
    const mockEntry = {
      id: mockKey,
      url: url.pathname,
      method: request.method,
      timestamp: new Date().toISOString(),
      status: 'pending',
      response: responseData
    };

    await putInStore('mockResponses', mockEntry);
    logger.info('Stored mock response:', mockEntry);
    return mockEntry;
  } catch (error) {
    logger.error('Failed to store mock response:', error);
    throw error;
  }
}

/**
 * Update the approval status of a mock response
 * @param {string} key 
 * @param {boolean} approved 
 * @returns {Promise<Object>}
 */
export async function updateMockResponseStatus(key, approved) {
  try {
    const mockEntry = await getFromStore('mockResponses', key);
    if (!mockEntry) {
      throw new Error(`Mock response not found: ${key}`);
    }

    const updatedEntry = {
      ...mockEntry,
      approved,
      reviewedAt: new Date().toISOString()
    };

    await putInStore('mockResponses', updatedEntry);
    logger.info('Updated mock response status:', updatedEntry);
    return updatedEntry;
  } catch (error) {
    logger.error('Failed to update mock response status:', error);
    throw error;
  }
}

/**
 * Clear all mock responses
 * @returns {Promise<void>}
 */
export async function clearMockData() {
  return clearStore('mockResponses');
}

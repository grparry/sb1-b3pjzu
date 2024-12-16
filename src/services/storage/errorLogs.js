import { putInStore, clearStore } from './dataStore';
import { logger } from '../utils/logging';

/**
 * Log an error
 * @param {Error} error 
 * @returns {Promise<Object>}
 */
export async function logError(error) {
  try {
    const errorEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.name || 'Error'
    };

    await putInStore('errors', errorEntry);
    logger.info('Logged error', errorEntry);
    return errorEntry;
  } catch (err) {
    logger.error('Failed to log error', err);
    return null;
  }
}

/**
 * Clear all error logs
 * @returns {Promise<void>}
 */
export async function clearErrors() {
  return clearStore('errors');
}

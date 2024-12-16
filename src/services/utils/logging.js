/**
 * Utility function to add timestamps to log messages
 * @param {string} message - The message to log
 * @param {*} data - Optional data to log
 * @param {'info' | 'warn' | 'error' | 'debug'} level - Log level
 */
function logWithTimestamp(message, data = null, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  // Only log data for certain store operations if it's debug level
  const shouldLogData = level === 'debug' || 
    (data && !Array.isArray(data) && typeof data === 'object' && !('length' in data));
  
  if (level === 'error') {
    console.error(logMessage, shouldLogData ? data : '');
  } else if (level === 'warn') {
    console.warn(logMessage, shouldLogData ? data : '');
  } else {
    console.log(logMessage, shouldLogData ? data : '');
  }
}

// Create a logger object that uses logWithTimestamp
export const logger = {
  info: (message, data) => logWithTimestamp(message, data, 'info'),
  warn: (message, data) => logWithTimestamp(message, data, 'warn'),
  error: (message, data) => logWithTimestamp(message, data, 'error'),
  debug: (message, data) => logWithTimestamp(message, data, 'debug')
};

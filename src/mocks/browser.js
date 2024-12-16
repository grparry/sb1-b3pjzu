import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { logger } from '../services/utils/logging';

// Create and configure the worker
const worker = setupWorker(...handlers);
let isInitialized = false;

// Helper to get stack trace
const getStackTrace = () => {
  const stack = new Error().stack;
  logger.debug('Current stack trace:', stack);
  return stack;
};

// Helper to check if a request should be ignored
const shouldIgnoreRequest = (url) => {
  // Only intercept backoffice-test.abaka.me requests
  return !url.includes('backoffice-test.abaka.me');
};

// Helper to check if we're in a valid context
const isValidContext = () => {
  try {
    // Check if we're in a browser context
    if (typeof window === 'undefined') {
      logger.warn('Not in browser context');
      return false;
    }
    
    // Check if we're in a content script
    if (window.chrome?.runtime?.id) {
      logger.warn('Detected content script context');
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Context check failed:', error);
    return false;
  }
};

// Export initialization function with fallback mode
export async function initializeMSW() {
  if (!isValidContext()) {
    logger.warn({ message: 'Invalid context for MSW initialization', stack: getStackTrace() });
    return false;
  }

  if (process.env.NODE_ENV !== 'development') {
    logger.info({ message: 'MSW is disabled in production', stack: getStackTrace() });
    return false;
  }

  if (isInitialized) {
    logger.info({ message: 'MSW is already initialized', stack: getStackTrace() });
    return true;
  }

  try {
    logger.info({ message: 'Starting MSW worker initialization', stack: getStackTrace() });
    
    // Configure worker to be more selective
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: {
          scope: '/',
          type: 'module',
        },
      },
      quiet: false,
      onUnhandledRequest: (request, print) => {
        if (shouldIgnoreRequest(request.url)) {
          return;
        }
        print.warning();
      },
    });

    isInitialized = true;
    logger.info({ message: 'MSW worker initialized successfully', stack: getStackTrace() });
    return true;
  } catch (error) {
    logger.error({ message: 'Failed to initialize MSW worker', error, stack: getStackTrace() });
    return false;
  }
}

// Function to set up handlers after database is initialized
export function setupMSWHandlers() {
  if (!isValidContext()) {
    logger.warn({ message: 'Invalid context for MSW handlers setup', stack: getStackTrace() });
    return;
  }

  try {
    if (!isInitialized) {
      logger.warn({ message: 'Cannot set up MSW handlers - worker not initialized', stack: getStackTrace() });
      return;
    }
    worker.resetHandlers(...handlers);
    logger.info({ message: 'MSW handlers set up successfully', stack: getStackTrace() });
  } catch (error) {
    logger.error({ message: 'Failed to set up MSW handlers', error, stack: getStackTrace() });
    throw error;
  }
}
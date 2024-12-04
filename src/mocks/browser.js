import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { InitializationManager } from '../utils/initialization/InitializationManager';
import { Logger } from '../utils/logging/Logger';

// Create and configure the worker
export const worker = setupWorker(...handlers);

// Helper to check if a request should be ignored
const shouldIgnoreRequest = (url) => {
  // Ignore static assets
  if (/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|eot)$/.test(url)) return true;
  
  // Ignore development-specific requests
  if (url.includes('/mockServiceWorker.js')) return true;
  if (url.includes('hot-update')) return true;
  if (url.includes('@vite')) return true;
  if (url.includes('/__vite')) return true;
  if (url.includes('favicon')) return true;
  
  // Only intercept API requests
  return !url.includes('/api/');
};

// Export initialization function with fallback mode
export async function initializeMSW() {
  if (process.env.NODE_ENV !== 'development') {
    Logger.log('MSW', 'MSW is disabled in production', Logger.LEVELS.INFO);
    return false;
  }

  try {
    Logger.log('MSW', 'Starting MSW initialization...', Logger.LEVELS.INFO);
    
    // Wait for app initialization to complete
    const initManager = InitializationManager.getInstance();
    if (!initManager.isInitialized()) {
      Logger.log('MSW', 'Waiting for app initialization to complete...', Logger.LEVELS.INFO);
      await initManager.initialize();
    }
    
    // Start MSW with more verbose options
    await worker.start({
      onUnhandledRequest(request, print) {
        const url = request.url;
        
        // Skip logging for ignored requests
        if (shouldIgnoreRequest(url)) {
          return;
        }
        
        // Log warning for unhandled API requests
        print.warning();
      },
      quiet: false // Enable MSW logging
    });

    Logger.log('MSW', 'MSW initialized successfully', Logger.LEVELS.INFO);
    return true;
  } catch (error) {
    Logger.error('MSW', 'MSW initialization failed:', error);
    return false;
  }
}
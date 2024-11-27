import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create and configure the worker
export const worker = setupWorker(...handlers);

// Export initialization function with fallback mode
export async function initializeMSW() {
  try {
    // Start MSW in memory-only mode (no Service Worker)
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
      // Disable Service Worker usage
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: {
          scope: '/',
          type: 'module',
          credentials: 'omit'
        }
      }
    });

    // Add error handling for worker events
    worker.events.on('request:start', ({ request }) => {
      console.debug('MSW intercepted:', request.method, request.url);
    });

    worker.events.on('request:match', ({ request, requestId }) => {
      console.debug('MSW matched request:', request.method, request.url, requestId);
    });

    worker.events.on('request:unhandled', ({ request }) => {
      console.debug('MSW unhandled request:', request.method, request.url);
    });

    worker.events.on('request:fail', ({ request, error }) => {
      console.error('MSW request failed:', request.method, request.url, error);
    });

    worker.events.on('unhandledException', (error) => {
      console.error('MSW exception:', error);
    });

    console.log('MSW initialized in memory-only mode');
    return true;
  } catch (error) {
    console.warn('MSW initialization failed:', error);
    return false;
  }
}
import { Logger } from '../logging/Logger';
import useAppStore from '../../stores/appStore';
import { clearErrors, clearNetwork } from '../../services/storage';

export class InitializationManager {
    static instance = null;
    #isInitializing = false;
    #isInitialized = false;

    static getInstance() {
        if (!InitializationManager.instance) {
            InitializationManager.instance = new InitializationManager();
        }
        return InitializationManager.instance;
    }

    isInitialized() {
        return this.#isInitialized;
    }

    #logPerformance(label, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        Logger.log('Performance', `${label} took ${duration.toFixed(2)}ms`);
    }

    async initialize() {
        if (this.#isInitializing || this.#isInitialized) {
            Logger.warn('InitManager', 'Initialization already in progress or completed');
            return;
        }

        this.#isInitializing = true;
        const startTime = performance.now();

        try {
            Logger.info('InitManager', 'Starting application initialization');

            // Clear network and error logs
            await this.#clearLogs();

            // Initialize database
            await this.#initializeDatabase();

            // Initialize stores
            await this.#initializeStores();

            // Initialize MSW in development
            if (process.env.NODE_ENV === 'development') {
                await this.#initializeMSW();
            }

            this.#isInitialized = true;
            this.#isInitializing = false;

            // Update app store state
            useAppStore.getState().setInitialized(true);

            Logger.info('InitManager', 'Application initialization completed successfully');
            this.#logPerformance('total-init', startTime);
        } catch (error) {
            this.#isInitializing = false;
            Logger.error('InitManager', 'Initialization failed', error);
            
            // Update app store error state
            useAppStore.getState().setError(error);
            
            throw error;
        }
    }

    async #clearLogs() {
        const startTime = performance.now();
        try {
            Logger.info('InitManager', 'Clearing network and error logs');
            await clearErrors();
            await clearNetwork();
            Logger.info('InitManager', 'Logs cleared successfully');
        } catch (error) {
            Logger.error('InitManager', 'Failed to clear logs:', error);
            // Don't throw error, just log it and continue
        } finally {
            this.#logPerformance('clear-logs', startTime);
        }
    }

    async #initializeDatabase() {
        const startTime = performance.now();
        try {
            Logger.info('Database', 'Starting database initialization');
            
            // Check IndexedDB availability
            const indexedDBAvailable = 'indexedDB' in window;
            Logger.log('Database', `IndexedDB availability: ${indexedDBAvailable}`);
            
            if (!indexedDBAvailable) {
                throw new Error('IndexedDB is not available in this browser');
            }

            // Initialize database connection
            Logger.info('Database', 'Opening database connection...');
            await this.#openDatabaseConnection();
            
            Logger.info('Database', 'Database initialization completed successfully');
        } catch (error) {
            Logger.error('Database', 'Database initialization failed', error);
            throw error;
        } finally {
            this.#logPerformance('database-init', startTime);
        }
    }

    async #openDatabaseConnection() {
        // Add your database connection logic here
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulated delay
    }

    async #initializeStores() {
        const startTime = performance.now();
        try {
            Logger.info('Store', 'Starting store initialization');
            
            const stores = ['nudges', 'collections', 'media', 'network', 'errors', 'mockResponses'];
            const storeResults = {};
            
            for (const store of stores) {
                const storeStartTime = performance.now();
                Logger.info('Store', `Initializing ${store} store...`);
                
                try {
                    // Add your store initialization logic here
                    await this.#initializeStore(store);
                    Logger.info('Store', `${store} store initialized successfully`);
                } catch (error) {
                    Logger.error('Store', `Failed to initialize ${store} store`, error);
                    throw error;
                } finally {
                    this.#logPerformance(`store-${store}`, storeStartTime);
                }
            }
            
            Logger.info('Store', 'Store initialization completed successfully');
            return storeResults;
        } catch (error) {
            Logger.error('Store', 'Store initialization failed', error);
            throw error;
        } finally {
            this.#logPerformance('store-init', startTime);
        }
    }

    async #initializeStore(store) {
        // Add your store initialization logic here
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulated delay
    }

    async #initializeMSW() {
        const startTime = performance.now();
        try {
            Logger.info('MSW', 'Starting MSW initialization');
            
            const { worker } = await import('../../mocks/browser');
            await worker.start({
                onUnhandledRequest: 'bypass',
                quiet: true
            });

            Logger.info('MSW', 'MSW initialized successfully');
            this.#logPerformance('msw-init', startTime);
            return true;
        } catch (error) {
            Logger.error('MSW', 'MSW initialization failed', error);
            this.#logPerformance('msw-init', startTime);
            throw error;
        }
    }
}

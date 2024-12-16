import { logger } from '../../services/utils/logging';
import useAppStore from '../../stores/appStore';
import { clearErrors } from '../../services/storage/errorLogs';
import { clearNetwork } from '../../services/storage/networkLogs';
import { resetDatabase, getDB } from '../../services/storage/core';
import { initializeStores } from '../../mocks/initializeStores';
import { initializeMSW, setupMSWHandlers } from '../../mocks/browser';
import useConfigStore from '../../services/config';

// Keep MSW enabled for development, but control its usage through useMockData
const ENABLE_MSW = true;

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
        logger.info(`${label} took ${duration.toFixed(2)}ms`);
    }

    async initialize(force = false) {
        if ((this.#isInitializing || this.#isInitialized) && !force) {
            logger.warn('Initialization already in progress or completed');
            return;
        }

        // Reset initialization state if force is true
        if (force) {
            this.#isInitialized = false;
            this.#isInitializing = false;
            useAppStore.getState().reset();
        }

        // Don't proceed if already initializing
        if (this.#isInitializing) {
            logger.warn('Initialization already in progress');
            return;
        }

        this.#isInitializing = true;
        useAppStore.getState().setInitialized(false);
        const startTime = performance.now();

        try {
            const getStackTrace = () => {
                const stack = new Error().stack;
                logger.debug('Current stack trace:', stack);
                return stack;
            };

            logger.info('Starting initialization sequence', { stack: getStackTrace() });
            
            // Initialize database first
            logger.info('Initializing database');
            let db;
            try {
                db = await getDB();
                logger.debug('Database initialized successfully', { stack: getStackTrace() });
            } catch (dbError) {
                logger.error('Database initialization failed', { error: dbError, stack: getStackTrace() });
                throw dbError;
            }
            
            // Check if stores have data
            let hasCollections = false;
            let hasNudges = false;
            try {
                const tx = db.transaction(['collections', 'nudges'], 'readonly');
                const collectionsStore = tx.objectStore('collections');
                const nudgesStore = tx.objectStore('nudges');
                hasCollections = await collectionsStore.count() > 0;
                hasNudges = await nudgesStore.count() > 0;
                await tx.done;
                logger.debug('Store check completed', { hasCollections, hasNudges, stack: getStackTrace() });
            } catch (txError) {
                logger.error('Store check failed', { error: txError, stack: getStackTrace() });
                throw txError;
            }
            
            // Get config after database is ready
            let useMockData;
            try {
                useMockData = useConfigStore.getState().useMockData;
                logger.debug('Config loaded', { useMockData, stack: getStackTrace() });
            } catch (configError) {
                logger.error('Config load failed', { error: configError, stack: getStackTrace() });
                throw configError;
            }
            
            // Initialize MSW if enabled
            if (ENABLE_MSW) {
                logger.info('Initializing MSW worker');
                try {
                    const initialized = await initializeMSW();
                    if (!initialized) {
                        logger.error('Failed to initialize MSW worker');
                        throw new Error('Failed to initialize MSW worker');
                    }
                    logger.debug('MSW worker initialized', { stack: getStackTrace() });

                    // Set up MSW handlers if using mock data
                    if (useMockData) {
                        logger.info('Setting up MSW handlers');
                        setupMSWHandlers();
                        logger.debug('MSW handlers set up', { stack: getStackTrace() });
                    }
                } catch (mswError) {
                    logger.error('MSW initialization failed', { error: mswError, stack: getStackTrace() });
                    throw mswError;
                }
            }
            
            // Only initialize with mock data if using mock data and stores are empty
            if (useMockData && (!hasCollections || !hasNudges)) {
                logger.info('Stores are empty and mock data is enabled, initializing with mock data');
                try {
                    await resetDatabase();
                    logger.debug('Database reset successfully', { stack: getStackTrace() });
                } catch (resetError) {
                    logger.error('Database reset failed', { error: resetError, stack: getStackTrace() });
                    throw resetError;
                }
                try {
                    await initializeStores(true);
                    logger.debug('Stores initialized with mock data', { stack: getStackTrace() });
                } catch (storesError) {
                    logger.error('Store initialization with mock data failed', { error: storesError, stack: getStackTrace() });
                    throw storesError;
                }
                
                // Set up MSW handlers after data is initialized
                if (ENABLE_MSW) {
                    logger.info('Setting up MSW handlers');
                    try {
                        setupMSWHandlers();
                        logger.debug('MSW handlers set up', { stack: getStackTrace() });
                    } catch (handlersError) {
                        logger.error('MSW handlers setup failed', { error: handlersError, stack: getStackTrace() });
                        throw handlersError;
                    }
                }
            } else if (!hasCollections || !hasNudges) {
                logger.info('Stores are empty but using real data, skipping mock data initialization');
            } else {
                logger.info('Stores already have data');
                
                // Set up MSW handlers if mock data is enabled
                if (ENABLE_MSW && useMockData) {
                    logger.info('Setting up MSW handlers');
                    try {
                        setupMSWHandlers();
                        logger.debug('MSW handlers set up', { stack: getStackTrace() });
                    } catch (handlersError) {
                        logger.error('MSW handlers setup failed', { error: handlersError, stack: getStackTrace() });
                        throw handlersError;
                    }
                }
            }

            // Load store data and wait for it to complete
            logger.info('Loading store data');
            try {
                const storeData = await useAppStore.getState().loadStoreData(true);
                logger.debug('Store data loaded', { storeData, stack: getStackTrace() });
            } catch (storeDataError) {
                logger.error('Store data load failed', { error: storeDataError, stack: getStackTrace() });
                throw storeDataError;
            }
            
            // Clear any previous logs
            logger.info('Clearing logs');
            try {
                await clearErrors();
                logger.debug('Error logs cleared', { stack: getStackTrace() });
            } catch (clearErrorsError) {
                logger.error('Error logs clear failed', { error: clearErrorsError, stack: getStackTrace() });
                throw clearErrorsError;
            }
            try {
                await clearNetwork();
                logger.debug('Network logs cleared', { stack: getStackTrace() });
            } catch (clearNetworkError) {
                logger.error('Network logs clear failed', { error: clearNetworkError, stack: getStackTrace() });
                throw clearNetworkError;
            }

            this.#isInitialized = true;
            useAppStore.getState().setInitialized(true);
            this.#logPerformance('Full initialization', startTime);
            logger.info('Initialization completed successfully');
            return this.#isInitialized;
        } catch (error) {
            logger.error('Initialization failed', { error, stack: new Error().stack });
            useAppStore.getState().setError(error);
            throw error;
        } finally {
            this.#isInitializing = false;
        }
    }

    setFallbackMode(enabled) {
        useAppStore.getState().setError(enabled ? new Error('Fallback mode enabled') : null);
    }
}

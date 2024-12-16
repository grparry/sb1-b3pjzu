import { create } from 'zustand';
import { getAllFromStore } from '../services/storage';
import { logger } from '../services/utils/logging';

// Debounce and loading state management
let loadDataTimeout = null;
let loadDataPromise = null;
let isLoadingData = false;
let lastLoadTime = 0;
const LOAD_COOLDOWN = 1000; // Minimum time between loads in ms

const useAppStore = create((set, get) => ({
  isInitialized: false,
  error: null,
  storeData: {
    nudges: [],
    collections: [],
    media: [],
    mediaFolders: [],
    network: [],
    errors: [],
    mockResponses: [],
    users: []
  },
  setInitialized: (value) => {
    logger.debug('Setting initialization state:', { value });
    set({ isInitialized: value });
  },
  setError: (error) => {
    logger.error('Setting error state:', error);
    set({ error });
  },
  reset: () => {
    // Clear any pending loads
    if (loadDataTimeout) {
      clearTimeout(loadDataTimeout);
      loadDataTimeout = null;
    }
    loadDataPromise = null;
    isLoadingData = false;
    lastLoadTime = 0;
    
    set({ 
      isInitialized: false,
      error: null,
      storeData: {
        nudges: [],
        collections: [],
        media: [],
        mediaFolders: [],
        network: [],
        errors: [],
        mockResponses: [],
        users: []
      }
    });
  },
  loadStoreData: async (forceReload = false) => {
    const now = Date.now();
    
    // Don't reload if we're already loading or if we've loaded recently
    if (!forceReload && (isLoadingData || (now - lastLoadTime < LOAD_COOLDOWN))) {
      return loadDataPromise;
    }

    // Clear any pending loads
    if (loadDataTimeout) {
      clearTimeout(loadDataTimeout);
    }

    isLoadingData = true;
    loadDataPromise = (async () => {
      try {
        const storeData = {};
        const stores = ['nudges', 'collections', 'media', 'mediaFolders', 'network', 'errors', 'mockResponses', 'users'];
        
        for (const store of stores) {
          try {
            storeData[store] = await getAllFromStore(store) || [];
          } catch (error) {
            logger.error(`Failed to load ${store} store:`, error);
            storeData[store] = [];
          }
        }

        set({ storeData });
        lastLoadTime = Date.now();
        return storeData;
      } catch (error) {
        logger.error('Failed to load store data:', error);
        throw error;
      } finally {
        isLoadingData = false;
      }
    })();

    return loadDataPromise;
  }
}));

export default useAppStore;
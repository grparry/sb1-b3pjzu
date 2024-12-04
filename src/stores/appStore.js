import { create } from 'zustand';
import { getAllFromStore } from '../services/storage';

// Debounce and loading state management
let loadDataTimeout = null;
let loadDataPromise = null;
let isLoadingData = false;
let lastLoadTime = 0;
const LOAD_COOLDOWN = 1000; // Minimum time between loads in ms

const useAppStore = create((set, get) => ({
  isInitialized: false,
  isInitializing: true,
  error: null,
  storeData: {
    nudges: [],
    collections: [],
    media: [],
    network: [],
    errors: [],
    mockResponses: [],
    users: []
  },
  setInitialized: (value) => set({ isInitialized: value, isInitializing: false }),
  setError: (error) => set({ error, isInitializing: false }),
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
      isInitializing: true, 
      error: null,
      storeData: {
        nudges: [],
        collections: [],
        media: [],
        network: [],
        errors: [],
        mockResponses: [],
        users: []
      }
    });
  },
  
  // Load all store data at once with improved debouncing
  loadStoreData: async (forceReload = false) => {
    console.log('[loadStoreData] Starting with forceReload:', forceReload);
    const now = Date.now();
    
    // If a load was completed recently and not forcing reload, return the existing data
    if (!forceReload && now - lastLoadTime < LOAD_COOLDOWN) {
      console.log('[loadStoreData] Skipping load - within cooldown period');
      return Promise.resolve(get().storeData);
    }

    // If there's already a load in progress and not forcing reload, return that promise
    if (!forceReload && isLoadingData) {
      console.log('[loadStoreData] Store data load already in progress, returning existing promise');
      return loadDataPromise;
    }

    // Clear any pending timeout
    if (loadDataTimeout) {
      console.log('[loadStoreData] Clearing existing timeout');
      clearTimeout(loadDataTimeout);
    }

    // Create a new promise for this load
    isLoadingData = true;
    loadDataPromise = new Promise((resolve, reject) => {
      // If forcing reload, load immediately, otherwise debounce
      const loadFn = async () => {
        try {
          console.log('[loadStoreData] Beginning data load for all stores');
          const storeNames = ['nudges', 'collections', 'media', 'network', 'errors', 'mockResponses', 'users'];
          const storePromises = storeNames.map(store => 
            getAllFromStore(store).catch(err => {
              console.warn(`[loadStoreData] Warning loading ${store}:`, err);
              return [];
            })
          );

          console.log('[loadStoreData] Waiting for all store data...');
          const [nudges, collections, media, network, errors, mockResponses, users] = await Promise.all(storePromises);

          const newStoreData = {
            nudges: nudges || [],
            collections: collections || [],
            media: media || [],
            network: network || [],
            errors: errors || [],
            mockResponses: mockResponses || [],
            users: users || []
          };

          console.log('[loadStoreData] All data loaded, updating store');
          set({ storeData: newStoreData });
          lastLoadTime = Date.now();
          isLoadingData = false;
          console.log('[loadStoreData] Store update complete');
          resolve(newStoreData);
        } catch (error) {
          console.error('[loadStoreData] Error loading store data:', error);
          isLoadingData = false;
          reject(error);
        }
      };

      if (forceReload) {
        console.log('[loadStoreData] Force reload requested, loading immediately');
        loadFn();
      } else {
        console.log('[loadStoreData] Debouncing load');
        loadDataTimeout = setTimeout(loadFn, 100);
      }
    });

    return loadDataPromise;
  }
}));

export default useAppStore;
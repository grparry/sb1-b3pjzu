import { getDB, clearStore, putInStore, getAllFromStore } from '../services/storage';
import { mockData } from './mockData';
import useConfigStore from '../services/config';

export async function initializeStores(force = false) {
  console.log(`Starting store initialization... (force=${force})`);
  
  try {
    const { useMockData } = useConfigStore.getState();
    
    // If we're not using mock data and not forcing initialization, skip
    if (!useMockData && !force) {
      console.log('Mock data is disabled, skipping initialization');
      return;
    }

    // Check if any stores have data first
    const storeNames = ['nudges', 'collections', 'media', 'folders', 'users'];
    let hasExistingData = false;

    if (!force) {
      for (const storeName of storeNames) {
        const items = await getAllFromStore(storeName);
        if (items && items.length > 0) {
          hasExistingData = true;
          break;
        }
      }
    }

    if (hasExistingData && !force) {
      console.log('Stores already have data, skipping initialization');
      return;
    }

    // Clear and initialize each store
    for (const storeName of storeNames) {
      console.log(`Initializing ${storeName} store...`);
      await clearStore(storeName);
      
      if (mockData[storeName] && mockData[storeName].length > 0) {
        for (const item of mockData[storeName]) {
          await putInStore(storeName, item);
        }
        console.log(`Added ${mockData[storeName].length} items to ${storeName}`);
      } else {
        console.log(`No mock data available for ${storeName}`);
      }
    }

    // Enable mock data if we're initializing
    if (!useMockData) {
      useConfigStore.getState().setUseMockData(true);
    }

    console.log('Store initialization complete');
  } catch (error) {
    console.error('Error during store initialization:', error);
    throw error;
  }
}
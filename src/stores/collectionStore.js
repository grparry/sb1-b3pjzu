import { create } from 'zustand';
import { getAllFromStore } from '../services/storage';

const useCollectionStore = create((set) => ({
  collections: [],
  isLoading: false,
  error: null,
  
  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const collections = await getAllFromStore('collections');
      set({ collections, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  reset: () => {
    set({ collections: [], isLoading: false, error: null });
  }
}));

export default useCollectionStore;
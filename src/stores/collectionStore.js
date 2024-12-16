import { create } from 'zustand';
import { getAllFromStore, putInStore } from '../services/storage';

const useCollectionStore = create((set) => ({
  collections: [],
  isLoading: false,
  error: null,
  
  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const collections = await getAllFromStore('collections');
      set({ collections: collections || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching collections:', error);
    }
  },
  
  addNudgeToCollection: (collectionId, nudgeId) => {
    set(state => ({
      collections: state.collections.map(collection => 
        collection.id === collectionId
          ? { ...collection, items: [...collection.items, nudgeId] }
          : collection
      )
    }));
  },
  
  removeNudgeFromCollection: (collectionId, nudgeId) => {
    set(state => ({
      collections: state.collections.map(collection => 
        collection.id === collectionId
          ? { ...collection, items: collection.items.filter(id => id !== nudgeId) }
          : collection
      )
    }));
  },
  
  reset: () => {
    set({ collections: [], isLoading: false, error: null });
  },
  
  createCollection: async ({ name, description = '', category = '' }) => {
    set({ isLoading: true, error: null });
    try {
      // Generate ID from name, ensuring it's unique
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const newCollection = {
        id,
        name,
        description,
        category,
        items: [] // Ensure items array exists
      };
      
      // Get existing collections to check for duplicates
      const existingCollections = await getAllFromStore('collections') || [];
      if (existingCollections.some(c => c.id === id)) {
        throw new Error('A collection with this name already exists');
      }
      
      // Save to storage first
      await putInStore('collections', newCollection);
      
      // Update state after successful save
      set(state => ({
        collections: [...state.collections, newCollection],
        isLoading: false
      }));
      
      return newCollection;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error creating collection:', error);
      throw error;
    }
  },

  updateCollection: async (collection) => {
    set({ isLoading: true, error: null });
    try {
      // Save to storage first
      await putInStore('collections', collection);
      
      // Update state after successful save
      set(state => ({
        collections: state.collections.map(c => 
          c.id === collection.id ? collection : c
        ),
        isLoading: false
      }));
      
      return collection;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error updating collection:', error);
      throw error;
    }
  }
}));

export default useCollectionStore;
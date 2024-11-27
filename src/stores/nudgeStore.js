import { create } from 'zustand';
import { getAllFromStore, getFromStore } from '../services/storage';

const useNudgeStore = create((set, get) => ({
  nudges: [],
  currentNudge: null,
  isLoading: false,
  error: null,
  
  fetchNudges: async () => {
    set({ isLoading: true, error: null });
    try {
      const nudges = await getAllFromStore('nudges');
      set({ nudges, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchNudge: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const nudge = await getFromStore('nudges', id);
      set({ currentNudge: nudge, isLoading: false });
      return nudge;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  reset: () => {
    set({ nudges: [], currentNudge: null, isLoading: false, error: null });
  }
}));

export default useNudgeStore;
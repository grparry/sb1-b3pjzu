import { create } from 'zustand';
import {
  fetchNudges as apiFetchNudges,
  fetchNudge as apiFetchNudge,
  createNudge as apiCreateNudge,
  updateNudge as apiUpdateNudge,
  deleteNudge as apiDeleteNudge
} from '../services/api';

const useNudgeStore = create((set, get) => ({
  nudges: [],
  currentNudge: null,
  isLoading: false,
  error: null,
  
  fetchNudges: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiFetchNudges();
      set({ nudges: response || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchNudge: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiFetchNudge(id);
      const nudge = response;
      set({ currentNudge: nudge, isLoading: false });
      return nudge;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createNudge: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiCreateNudge(data);
      const newNudge = response;
      set(state => ({
        nudges: [...state.nudges, newNudge],
        currentNudge: newNudge,
        isLoading: false
      }));
      return newNudge;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateNudge: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiUpdateNudge(id, data);
      const updatedNudge = response;
      set(state => ({
        nudges: state.nudges.map(nudge => 
          nudge.id === id ? updatedNudge : nudge
        ),
        currentNudge: state.currentNudge?.id === id ? updatedNudge : state.currentNudge,
        isLoading: false
      }));
      return updatedNudge;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteNudge: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteNudge(id);
      set(state => ({
        nudges: state.nudges.filter(nudge => nudge.id !== id),
        currentNudge: state.currentNudge?.id === id ? null : state.currentNudge,
        isLoading: false
      }));
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
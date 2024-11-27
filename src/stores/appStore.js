import { create } from 'zustand';

const useAppStore = create((set) => ({
  isInitialized: false,
  isInitializing: true,
  error: null,
  setInitialized: (value) => set({ isInitialized: value, isInitializing: false }),
  setError: (error) => set({ error, isInitializing: false }),
  reset: () => set({ isInitialized: false, isInitializing: true, error: null })
}));

export default useAppStore;
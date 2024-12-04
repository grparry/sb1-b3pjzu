// Configuration service to manage API vs Mock mode
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useConfigStore = create(
  persist(
    (set) => ({
      useMockData: false,
      captureResponses: false,
      logNetworkTraffic: false,
      apiBaseUrl: import.meta.env.VITE_API_URL || 'https://backoffice-test.abaka.me',
      setUseMockData: (value) => set({ useMockData: value }),
      setCaptureResponses: (value) => set({ captureResponses: value }),
      setLogNetworkTraffic: (value) => set({ logNetworkTraffic: value }),
      setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
    }),
    {
      name: 'config-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useConfigStore;

export const getConfig = () => {
  const { useMockData, captureResponses, logNetworkTraffic, apiBaseUrl } = useConfigStore.getState();
  return {
    useMockData,
    captureResponses,
    logNetworkTraffic,
    apiBaseUrl,
  };
};

export const setUseMockData = (value) => {
  useConfigStore.getState().setUseMockData(value);
};

export const setCaptureResponses = (value) => {
  useConfigStore.getState().setCaptureResponses(value);
};

export const setLogNetworkTraffic = (value) => {
  useConfigStore.getState().setLogNetworkTraffic(value);
};

export const setApiBaseUrl = (url) => {
  useConfigStore.getState().setApiBaseUrl(url);
};

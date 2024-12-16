// Configuration service to manage API vs Mock mode
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from './utils/logging';

// Default API base URL
const DEFAULT_API_URL = 'https://backoffice-test.abaka.me';

// Get API base URL from environment or default
const getInitialApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    logger.debug('Using API URL from environment:', envUrl);
    return envUrl;
  }
  logger.debug('Using default API URL:', DEFAULT_API_URL);
  return DEFAULT_API_URL;
};

const useConfigStore = create(
  persist(
    (set, get) => ({
      useMockData: true,
      captureResponses: true,
      logNetworkTraffic: false,
      apiModePanelVisible: true,
      apiBaseUrl: getInitialApiBaseUrl(),
      expandedModels: [],
      expandedCategories: [],
      setUseMockData: (value) => {
        logger.debug('Setting mock data mode:', value);
        set({ useMockData: value });
      },
      setCaptureResponses: (value) => {
        logger.debug('Setting capture responses:', value);
        set({ captureResponses: value });
      },
      setLogNetworkTraffic: (value) => {
        logger.debug('Setting log network traffic:', value);
        set({ logNetworkTraffic: value });
      },
      setApiModePanelVisible: (value) => {
        logger.debug('Setting API mode panel visibility:', value);
        set({ apiModePanelVisible: value });
      },
      setApiBaseUrl: (url) => {
        if (!url) {
          logger.warn('Attempted to set empty API base URL, using default');
          url = DEFAULT_API_URL;
        }
        logger.debug('Setting API base URL:', url);
        set({ apiBaseUrl: url });
      },
      setExpandedModels: (models) => set({ expandedModels: models }),
      setExpandedCategories: (categories) => set({ expandedCategories: categories }),
    }),
    {
      name: 'config-storage',
      storage: typeof window !== 'undefined' ? sessionStorage : undefined,
      skipHydration: true
    }
  )
);

export default useConfigStore;

export const getConfig = () => {
  const state = useConfigStore.getState();
  return {
    useMockData: state.useMockData,
    captureResponses: state.captureResponses,
    logNetworkTraffic: state.logNetworkTraffic,
    apiBaseUrl: state.apiBaseUrl || DEFAULT_API_URL,
    apiModePanelVisible: state.apiModePanelVisible,
    expandedModels: state.expandedModels,
    expandedCategories: state.expandedCategories,
  };
};

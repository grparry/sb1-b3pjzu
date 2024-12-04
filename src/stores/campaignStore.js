import { create } from 'zustand';
import {
  activateCampaign as apiActivateCampaign,
  deactivateCampaign as apiDeactivateCampaign,
  testCampaign as apiTestCampaign
} from '../services/api';

const useCampaignStore = create((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  isLoading: false,
  error: null,

  activateCampaign: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      await apiActivateCampaign(campaignId);
      set(state => ({
        campaigns: state.campaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'Active' }
            : campaign
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deactivateCampaign: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeactivateCampaign(campaignId);
      set(state => ({
        campaigns: state.campaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'Inactive' }
            : campaign
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  testCampaign: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      await apiTestCampaign(campaignId);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  reset: () => {
    set({ campaigns: [], currentCampaign: null, isLoading: false, error: null });
  }
}));

export default useCampaignStore;

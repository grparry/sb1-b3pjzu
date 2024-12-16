import { putInStore } from '../services/storage';
import { logger } from '../services/utils/logging';
import { mockData } from './mockData';

const mockNudges = [
  {
    id: 'nudge-1',
    title: 'Car Loan Offer',
    status: 'Active',
    version: '1.0',
    description: 'Special car loan offer for qualified customers'
  },
  {
    id: 'nudge-2',
    title: 'Personal Finance Tips',
    status: 'Draft',
    version: '1.0',
    description: 'Tips for better personal finance management'
  },
  {
    id: 'nudge-3',
    title: 'Loan Application Guide',
    status: 'Under Review',
    version: '1.0',
    description: 'Step-by-step guide for loan applications'
  }
];

const mockCollections = [
  {
    id: 'car-purchase-loan',
    name: 'Car Purchase Loan',
    description: 'Collections related to car purchase and loan applications',
    category: 'Loans',
    items: ['nudge-1']
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    description: 'Collections related to credit card products and offers',
    category: 'Cards',
    items: []
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance Management',
    description: 'Collections for personal finance management tools and features',
    category: 'Finance',
    items: ['nudge-2']
  },
  {
    id: 'loans',
    name: 'Loans',
    description: 'General loan-related collections',
    category: 'Loans',
    items: ['nudge-3']
  }
];

export async function initializeStores(force = false) {
  try {
    logger.info('Initializing stores with mock data');

    // Initialize nudges
    for (const nudge of mockData.nudges) {
      await putInStore('nudges', nudge);
    }
    logger.info('Initialized nudges store', { count: mockData.nudges.length });

    // Initialize collections
    for (const collection of mockData.collections) {
      await putInStore('collections', collection);
    }
    logger.info('Initialized collections store', { count: mockData.collections.length });

    return true;
  } catch (error) {
    logger.error('Failed to initialize stores', error);
    throw error;
  }
}
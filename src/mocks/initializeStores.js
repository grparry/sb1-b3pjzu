import { getDB, clearStore, putInStore } from '../services/storage';

const mockData = {
  nudges: [
    {
      id: 'high-users-repairs',
      title: 'Auto Loan for High Users with Repairs',
      collection: 'car-purchase-loan',
      businessValue: 'High conversion rate for auto repair loan products',
      priority: 'high',
      description: 'Targeted promotion for auto repair loans to existing car owners with repair history',
      version: 'Version 5 - Under Review',
      notificationTitle: 'Special Auto Loan Offer',
      notificationBody: 'Get a great rate on your auto repair loan',
      image: '',
      ageRange: { min: 25, max: 55 },
      income: { min: 50000, max: 150000 },
      gender: '-1',
      lastNotification: { days: '30' },
      registration: { registeredOnly: false },
      selectedTags: [
        {
          type: 'Must Have',
          conditions: [{
            tags: ['Car Owner', 'Car Repairs'],
            operator: 'AND'
          }]
        }
      ],
      comment: 'Initial version targeting car owners with repair history'
    }
  ],
  collections: [
    {
      id: 'car-purchase-loan',
      name: 'Car Purchase Loan',
      items: ['high-users-repairs']
    }
  ]
};

export async function initializeStores() {
  console.log('Starting store initialization...');
  
  try {
    const db = await getDB();
    
    // Initialize each store with mock data
    for (const [storeName, items] of Object.entries(mockData)) {
      console.log(`Initializing ${storeName} store...`);
      
      // Clear existing data
      await clearStore(storeName);
      
      // Add new data
      for (const item of items) {
        await putInStore(storeName, item);
      }
      
      console.log(`${storeName} store initialized with ${items.length} items`);
    }
    
    console.log('All stores initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize stores:', error);
    throw error;
  }
}
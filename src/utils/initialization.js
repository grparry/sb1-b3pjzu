import { getDB } from '../services/storage';
import { initializeStores } from '../mocks/initializeStores';
import useAppStore from '../stores/appStore';

export async function initializeApp() {
  const { setInitialized, setError } = useAppStore.getState();
  
  try {
    // Initialize database first
    const db = await getDB();
    console.log('Database initialized');

    // Initialize stores with mock data in development
    if (process.env.NODE_ENV === 'development') {
      await initializeStores();
      console.log('Mock data initialized');
    }

    setInitialized(true);
    return true;
  } catch (error) {
    console.error('Initialization failed:', error);
    setError(error.message);
    return false;
  }
}
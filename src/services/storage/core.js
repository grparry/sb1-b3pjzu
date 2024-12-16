import { openDB, deleteDB } from 'idb';
import { logger } from '../utils/logging';

// Database configuration
export const DB_NAME = 'engagement-studio';
export const DB_VERSION = 8;  // Increment version to handle store name change
export const STORES = [
  'nudges',
  'collections',
  'media',
  'mediaFolders',  // Updated from 'folders' to match new endpoint structure
  'users',
  'errors',
  'network',
  'mockResponses'
];

// Database instance management
let dbInstance = null;
let dbInitializing = null;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_COOLDOWN = 500; // ms

/**
 * Check if IndexedDB is available in the browser
 * @returns {boolean}
 */
export function isIndexedDBAvailable() {
  try {
    const isAvailable = 'indexedDB' in window && window.indexedDB !== null;
    logger.info('IndexedDB availability check', { isAvailable });
    return isAvailable;
  } catch (e) {
    logger.error('IndexedDB availability check failed', e);
    return false;
  }
}

/**
 * Reset the database by deleting and recreating it
 * @returns {Promise<void>}
 */
export async function resetDatabase() {
  logger.info('Resetting database');
  try {
    // Close existing connection
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    
    // Delete the database
    await deleteDB(DB_NAME);
    logger.info('Database deleted successfully');
    
    // Recreate by getting a new connection
    await getDB();
    logger.info('Database recreated successfully');
  } catch (error) {
    logger.error('Failed to reset database', error);
    throw error;
  }
}

/**
 * Get a connection to the database
 * @returns {Promise<IDBDatabase>}
 */
export async function getDB() {
  if (dbInstance) return dbInstance;
  if (dbInitializing) return dbInitializing;

  try {
    dbInitializing = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        logger.info('Upgrading database', { oldVersion, newVersion });
        
        // Delete existing stores if they exist
        Array.from(db.objectStoreNames).forEach(storeName => {
          db.deleteObjectStore(storeName);
          logger.info('Deleted store', { storeName });
        });
        
        // Create stores with explicit key path
        STORES.forEach(storeName => {
          const store = db.createObjectStore(storeName, { 
            keyPath: 'id',
            autoIncrement: false
          });
          logger.info('Created store', { storeName });
        });
      },
      blocked() {
        logger.warn('Database upgrade was blocked');
      },
      blocking() {
        logger.warn('Database upgrade is blocking');
      },
      terminated() {
        logger.error('Database was terminated');
      }
    });

    dbInstance = await dbInitializing;
    dbInitializing = null;
    return dbInstance;
  } catch (error) {
    logger.error('Failed to open database:', error);
    dbInitializing = null;
    throw error;
  }
}

/**
 * Ensure we have a valid database connection
 * @returns {Promise<IDBDatabase>}
 */
export async function ensureConnection() {
  const now = Date.now();
  if (now - lastConnectionCheck < CONNECTION_CHECK_COOLDOWN && dbInstance) {
    return dbInstance;
  }

  lastConnectionCheck = now;
  try {
    const db = await getDB();
    // Test the connection
    await db.transaction('network', 'readonly').objectStore('network').count();
    return db;
  } catch (error) {
    logger.error('Connection test failed:', error);
    dbInstance = null;
    return getDB();
  }
}

/**
 * Get all store names in the database
 * @returns {Promise<string[]>}
 */
export async function getAllStoreNames() {
  const db = await getDB();
  return Array.from(db.objectStoreNames);
}

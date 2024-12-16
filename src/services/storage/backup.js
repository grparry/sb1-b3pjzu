import { getDB, STORES } from './core';
import { logger } from '../utils/logging';
import { getAllFromStore, putInStore, clearStore } from './dataStore';

/**
 * Export the database to JSON
 * @returns {Promise<Object>}
 */
export async function exportDatabaseToJSON() {
  try {
    const backup = {};
    for (const storeName of STORES) {
      backup[storeName] = await getAllFromStore(storeName);
    }
    return backup;
  } catch (error) {
    logger.error('Failed to export database:', error);
    throw error;
  }
}

/**
 * Import data from JSON into the database
 * @param {Object} jsonData 
 * @returns {Promise<void>}
 */
export async function importDatabaseFromJSON(jsonData) {
  try {
    for (const [storeName, data] of Object.entries(jsonData)) {
      if (!STORES.includes(storeName)) {
        logger.warn(`Skipping unknown store: ${storeName}`);
        continue;
      }

      await clearStore(storeName);
      for (const record of data) {
        await putInStore(storeName, record);
      }
    }
  } catch (error) {
    logger.error('Failed to import database:', error);
    throw error;
  }
}

/**
 * Reset the database with optional initial data
 * @param {Object} data 
 * @returns {Promise<void>}
 */
export async function resetDatabase(data = null) {
  try {
    // Clear all stores
    for (const storeName of STORES) {
      await clearStore(storeName);
    }

    // Import initial data if provided
    if (data) {
      await importDatabaseFromJSON(data);
    }

    logger.info('Database reset complete');
  } catch (error) {
    logger.error('Failed to reset database', error);
    throw error;
  }
}

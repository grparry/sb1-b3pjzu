import { getDB, ensureConnection } from './core';
import { logger } from '../utils/logging';

/**
 * Get all records from a store
 * @param {string} storeName 
 * @returns {Promise<Array>}
 */
export async function getAllFromStore(storeName) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const records = await store.getAll();
    await tx.done;
    return records;
  } catch (error) {
    logger.error('Failed to get all from store', { storeName, error });
    throw error;
  }
}

/**
 * Get a specific record from a store
 * @param {string} storeName 
 * @param {string} id 
 * @returns {Promise<any>}
 */
export async function getFromStore(storeName, id) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const record = await store.get(id);
    await tx.done;
    return record;
  } catch (error) {
    logger.error('Failed to get from store', { storeName, error });
    throw error;
  }
}

/**
 * Add a record to a store
 * @param {string} storeName 
 * @param {Object} record 
 * @returns {Promise<string>} The ID of the added record
 */
export async function addRecord(storeName, record) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const id = await store.add(record);
    await tx.done;
    return id;
  } catch (error) {
    logger.error('Failed to add record to store', { storeName, error });
    throw error;
  }
}

/**
 * Put a record into a store
 * @param {string} storeName 
 * @param {Object} record 
 * @returns {Promise<any>}
 */
export async function putInStore(storeName, record) {
  try {
    logger.debug('Attempting to put record in store', { 
      recordId: record.id, 
      hasId: 'id' in record,
      recordKeys: Object.keys(record)
    });
    
    const db = await ensureConnection();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Validate record has required id
    if (!record.id) {
      throw new Error(`Record for ${storeName} must have an id property`);
    }
    
    const result = await store.put(record);
    await tx.done;
    logger.debug('Successfully stored in store', record);
    return result;
  } catch (error) {
    logger.error('Failed to put in store', { storeName, error });
    logger.error('Failed record:', record);
    if (error.name === 'AbortError') {
      dbInstance = null;
      return putInStore(storeName, record);
    }
    throw error;
  }
}

/**
 * Clear all records from a store
 * @param {string} storeName 
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    await tx.done;
    logger.info('Cleared store', { storeName });
  } catch (error) {
    logger.error('Failed to clear store', { storeName, error });
    throw error;
  }
}

/**
 * Check if a record exists in a store
 * @param {string} storeName 
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function recordExists(storeName, id) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const key = await store.getKey(id);
    await tx.done;
    return key !== undefined;
  } catch (error) {
    logger.error('Failed to check existence in store', { storeName, error });
    throw error;
  }
}

/**
 * Update a value in a store by path
 * @param {string} storeName 
 * @param {string|array} path 
 * @param {any} value 
 * @returns {Promise<void>}
 */
export async function updateByPath(storeName, path, value) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Get the record ID (second element in path array or after first dot)
    const recordId = Array.isArray(path) ? path[1] : path.split('.')[1];
    if (!recordId) {
      throw new Error(`Invalid path: ${path}. Path must include store name and record ID.`);
    }
    
    // Get only the specific record we want to update
    const record = await store.get(recordId);
    if (!record) {
      throw new Error(`Record ${recordId} not found in ${storeName}`);
    }

    // Get the path to the property we want to update (excluding store name and record ID)
    const pathParts = Array.isArray(path) ? path.slice(2) : path.split('.').slice(2);
    
    if (pathParts.length === 0) {
      // If no remaining path parts, we're updating the entire record
      // But preserve the ID when updating
      const updatedRecord = { ...record, ...value, id: recordId };
      await putInStore(storeName, updatedRecord);
    } else {
      // Navigate to the nested property
      let current = record;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Update the value
      current[pathParts[pathParts.length - 1]] = value;
      await putInStore(storeName, record);
    }

    await tx.done;
    logger.info('Updated record', { recordId, storeName });
  } catch (error) {
    logger.error('Error updating value', { error });
    throw error;
  }
}

/**
 * Delete a record from a store
 * @param {string} storeName 
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteRecord(storeName, id) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.delete(id);
    await tx.done;
  } catch (error) {
    logger.error('Failed to delete record from store', { storeName, error });
    throw error;
  }
}

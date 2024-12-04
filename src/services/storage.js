import { openDB, deleteDB } from 'idb';
import { mockData } from '../mocks/mockData';

const DB_NAME = 'engagement-studios';
// List of stores to create in the database
const STORES = [
  'nudges',
  'collections',
  'media',
  'folders',
  'users',
  'errors',
  'network',
  'mockResponses'
];

// Database version - increment this when making schema changes
export const DB_VERSION = 6;  // Increment version to trigger upgrade

let dbInstance = null;
let dbInitializing = null;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_COOLDOWN = 500; // ms

// Add timestamp to logs for better tracing
function logWithTimestamp(message, data = null, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  // Only log data for certain store operations if it's debug level
  const shouldLogData = level === 'debug' || 
    (data && !Array.isArray(data) && typeof data === 'object' && !('length' in data));
  
  if (level === 'error') {
    console.error(logMessage, shouldLogData ? data : '');
  } else if (level === 'warn') {
    console.warn(logMessage, shouldLogData ? data : '');
  } else {
    console.log(logMessage, shouldLogData ? data : '');
  }
}

// Check if IndexedDB is available
function isIndexedDBAvailable() {
  try {
    const isAvailable = 'indexedDB' in window && window.indexedDB !== null;
    logWithTimestamp(`IndexedDB availability: ${isAvailable}`);
    return isAvailable;
  } catch (e) {
    logWithTimestamp('IndexedDB availability check failed:', e, 'error');
    return false;
  }
}

async function getDB() {
  logWithTimestamp('=== getDB Called ===');
  // First check if IndexedDB is available
  if (!isIndexedDBAvailable()) {
    const error = new Error('IndexedDB is not available');
    logWithTimestamp('IndexedDB not available:', error, 'error');
    throw error;
  }

  if (dbInstance) {
    logWithTimestamp('Returning existing database instance');
    return dbInstance;
  }

  // If already initializing, wait for it
  if (dbInitializing) {
    logWithTimestamp('Database initialization in progress, waiting...');
    return dbInitializing;
  }

  try {
    logWithTimestamp('Starting database initialization');
    dbInitializing = openDB(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, newVersion) {
        logWithTimestamp(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Create stores if they don't exist
        STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: storeName === 'mockResponses' ? 'key' : 'id',
              autoIncrement: false 
            });
            if (storeName === 'network' || storeName === 'errors') {
              store.createIndex('timestamp', 'timestamp');
            }
            logWithTimestamp(`Created store: ${storeName}`);
          }
        });
      },
      blocked() {
        logWithTimestamp('Database blocked');
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
      blocking() {
        logWithTimestamp('Database blocking');
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
      terminated() {
        logWithTimestamp('Database terminated');
        dbInstance = null;
      }
    });

    dbInstance = await dbInitializing;
    dbInitializing = null;
    logWithTimestamp('Database initialization complete');
    return dbInstance;
  } catch (error) {
    logWithTimestamp('Failed to initialize database:', error, 'error');
    dbInitializing = null;
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
}

async function ensureConnection() {
  const now = Date.now();
  
  // If we've checked recently and have a valid connection, return early
  if (dbInstance && dbInstance.version && (now - lastConnectionCheck < CONNECTION_CHECK_COOLDOWN)) {
    return dbInstance;
  }
  
  logWithTimestamp('Ensuring database connection');
  try {
    if (!dbInstance || !dbInstance.version) {
      logWithTimestamp('No valid database instance, getting new connection');
      dbInstance = null;
      return getDB();
    }
    
    // Test the connection
    const names = Array.from(dbInstance.objectStoreNames);
    logWithTimestamp('Database connection test successful');
    lastConnectionCheck = now;
    return dbInstance;
  } catch (error) {
    logWithTimestamp('Database connection test failed:', error, 'error');
    dbInstance = null;
    return getDB();
  }
}

async function getAllStoreNames() {
  logWithTimestamp('Getting all store names');
  const db = await getDB();
  const names = Array.from(db.objectStoreNames);
  logWithTimestamp('Retrieved store names:', names);
  return names;
}

async function resetDatabase(data = null) {
  logWithTimestamp('=== Starting Database Reset ===');
  logWithTimestamp('Reset called with data:', data ? 'Data provided' : 'No data');
  
  // Close any existing connections
  if (dbInstance) {
    logWithTimestamp('Closing existing database connection');
    await dbInstance.close();
    dbInstance = null;
  }

  // Delete the existing database
  logWithTimestamp('Deleting existing database');
  await deleteDB(DB_NAME);
  
  // Get a fresh database instance
  logWithTimestamp('Getting fresh database instance');
  const db = await getDB();

  // Only proceed with data import if data is provided
  if (data) {
    logWithTimestamp('Initializing database with provided data');
    const stores = Array.from(db.objectStoreNames);
    logWithTimestamp('Available stores:', stores);
    
    try {
      // First clear all stores
      for (const storeName of stores) {
        logWithTimestamp(`Clearing store: ${storeName}`);
        const clearTx = db.transaction(storeName, 'readwrite');
        const store = clearTx.objectStore(storeName);
        await store.clear();
        await clearTx.done;
        logWithTimestamp(`Cleared store: ${storeName}`);
      }

      // Then import new data
      for (const [storeName, items] of Object.entries(data)) {
        if (!stores.includes(storeName)) {
          logWithTimestamp(`Store '${storeName}' not found in database schema`);
          continue;
        }

        if (!items || !items.length) {
          logWithTimestamp(`No items to import for store: ${storeName}`);
          continue;
        }

        logWithTimestamp(`Importing ${items.length} items into ${storeName}`);
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        for (const item of items) {
          try {
            await store.add(item);
            logWithTimestamp(`Added item to ${storeName}:`, item.id || item.key);
          } catch (err) {
            logWithTimestamp(`Failed to add item in ${storeName}, attempting put:`, err, 'warn');
            await store.put(item);
            logWithTimestamp(`Put item in ${storeName}:`, item.id || item.key);
          }
        }
        
        await tx.done;
        
        // Verify data was written
        const verifyTx = db.transaction(storeName, 'readonly');
        const verifyStore = verifyTx.objectStore(storeName);
        const count = await verifyStore.count();
        logWithTimestamp(`Verification - ${storeName} store count: ${count}`);
        await verifyTx.done;
      }
      
      logWithTimestamp('=== Database Reset Complete ===');
    } catch (error) {
      logWithTimestamp('Error during database reset:', error, 'error');
      throw error;
    }
  } else {
    logWithTimestamp('No data provided for database initialization');
  }
  
  return db;
}

async function importDatabaseFromJSON(jsonData) {
  logWithTimestamp('=== Starting Database Import ===');
  try {
    if (!jsonData) {
      const error = new Error('No data provided for import');
      logWithTimestamp('Import failed:', error, 'error');
      throw error;
    }
    
    const db = await getDB();
    const essentialStores = ['nudges', 'collections', 'media'];
    logWithTimestamp('Available stores for import:', essentialStores);
    logWithTimestamp('Input JSON data structure:', Object.keys(jsonData));

    // Log initial state
    for (const storeName of essentialStores) {
      const initialItems = await getAllFromStore(storeName);
      logWithTimestamp(`Initial ${storeName} count: ${initialItems.length}`);
    }

    // Import data store by store
    for (const storeName of essentialStores) {
      if (!jsonData[storeName]) {
        logWithTimestamp(`No data provided for store: ${storeName}, skipping...`);
        continue;
      }

      logWithTimestamp(`Processing store: ${storeName}`);
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Clear existing data
      await store.clear();
      logWithTimestamp(`Cleared existing data from ${storeName}`);
      
      // Import new data
      const items = jsonData[storeName];
      logWithTimestamp(`Importing ${items.length} items into ${storeName}`);
      
      for (const item of items) {
        try {
          await store.add(item);
          logWithTimestamp(`Added item to ${storeName}:`, item.id || item.key);
        } catch (err) {
          logWithTimestamp(`Failed to add item in ${storeName}, attempting put:`, err, 'warn');
          await store.put(item);
          logWithTimestamp(`Put item in ${storeName}:`, item.id || item.key);
        }
      }
      
      await tx.done;
      
      // Verify data was written
      const verifyTx = db.transaction(storeName, 'readonly');
      const verifyStore = verifyTx.objectStore(storeName);
      const count = await verifyStore.count();
      logWithTimestamp(`Verification - ${storeName} store count: ${count}`);
      await verifyTx.done;
    }

    logWithTimestamp('=== Database Import Complete ===');
    return db;
  } catch (error) {
    logWithTimestamp('Failed to import database:', error, 'error');
    throw error;
  }
}

async function getAllFromStore(storeName) {
  const db = await ensureConnection();
  try {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const items = await store.getAll();
    logWithTimestamp(`Retrieved ${items.length} items from ${storeName}:`, items);
    return items;
  } catch (error) {
    logWithTimestamp(`Error getting all from ${storeName}:`, error, 'error');
    throw error;
  }
}

async function getFromStore(storeName, id) {
  try {
    const db = await ensureConnection();
    const storeNames = await getAllStoreNames();
    
    // Return null if store doesn't exist
    if (!storeNames.includes(storeName)) {
      logWithTimestamp(`Store '${storeName}' does not exist, returning null`);
      return null;
    }
    
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const item = await store.get(id);
    await tx.done;
    logWithTimestamp(`Retrieved item from ${storeName}:`, id);
    return item;
  } catch (error) {
    logWithTimestamp(`Failed to get item from ${storeName}:`, error, 'error');
    if (error.name === 'AbortError') {
      dbInstance = null;
      return getFromStore(storeName, id);
    }
    return null; // Return null on error
  }
}

async function putInStore(storeName, record) {
  try {
    const db = await ensureConnection();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // For mock responses, the record is already properly structured
    if (storeName === 'mockResponses') {
      const result = await store.put(record);
      await tx.done;
      logWithTimestamp(`Put item in ${storeName}:`, record.key);
      return record.key;
    }
    
    // For other stores, ensure we have an id
    if (!record.id) {
      throw new Error(`Record in store '${storeName}' must have an 'id' field`);
    }
    
    // Don't add the composite key to the record since we're using id as keyPath
    const result = await store.put(record);
    await tx.done;
    logWithTimestamp(`Put item in ${storeName}:`, record.id);
    return record.id;
  } catch (error) {
    logWithTimestamp(`Failed to put data in store '${storeName}':`, error, 'error');
    throw error;
  }
}

async function clearStore(storeName) {
  try {
    const db = await ensureConnection();
    const storeNames = await getAllStoreNames();
    
    // Return if store doesn't exist
    if (!storeNames.includes(storeName)) {
      logWithTimestamp(`Store '${storeName}' does not exist, skipping clear`);
      return;
    }
    
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    await tx.done;
    logWithTimestamp(`Cleared store: ${storeName}`);
  } catch (error) {
    logWithTimestamp(`Failed to clear store ${storeName}:`, error, 'error');
    if (error.name === 'AbortError') {
      dbInstance = null;
      return clearStore(storeName);
    }
  }
}

async function logError(error) {
  try {
    const db = await ensureConnection();
    const tx = db.transaction('errors', 'readwrite');
    const store = tx.objectStore('errors');
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.name
    };
    await store.add(entry);
    await tx.done;
    logWithTimestamp('Logged error:', entry);
  } catch (err) {
    logWithTimestamp('Failed to log error:', err, 'error');
    if (err.name === 'AbortError') {
      dbInstance = null;
      return logError(error);
    }
  }
}

async function logNetwork(entry) {
  try {
    const db = await ensureConnection();
    const tx = db.transaction('network', 'readwrite');
    const store = tx.objectStore('network');
    const networkEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    await store.add(networkEntry);
    await tx.done;
    logWithTimestamp('Logged network entry:', networkEntry);
  } catch (error) {
    logWithTimestamp('Failed to log network entry:', error, 'error');
    if (error.name === 'AbortError') {
      dbInstance = null;
      return logNetwork(entry);
    }
  }
}

async function clearErrors() {
  return clearStore('errors');
}

async function clearNetwork() {
  return clearStore('network');
}

async function clearMockData() {
  return clearStore('mockResponses');
}

// Export database backup functions
async function exportDatabaseToJSON() {
  try {
    const db = await ensureConnection();
    const essentialStores = ['nudges', 'collections', 'media'];
    const backup = {};

    for (const storeName of essentialStores) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      backup[storeName] = await store.getAll();
      await tx.done;
    }

    const backupJSON = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagement-studios-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return backup;
  } catch (error) {
    logWithTimestamp('Failed to export database:', error, 'error');
    throw error;
  }
}

async function importDatabaseFromJSONNew(jsonData) {
  return importDatabaseFromJSON(jsonData);
}

// Add review capability for mock responses
async function addMockResponse(request, response, metadata = {}) {
  try {
    const db = await ensureConnection();
    const tx = db.transaction('mockResponses', 'readwrite');
    const store = tx.objectStore('mockResponses');
    
    const key = `mockResponses:${request.method}:${new URL(request.url).pathname}`;
    
    const mockResponse = {
      key,
      request: {
        method: request.method,
        url: request.url,
        headers: headersToObject(request.headers),
        body: request.body
      },
      response: {
        status: response.status,
        headers: headersToObject(response.headers),
        body: response.body
      },
      metadata: {
        ...metadata,
        captured: new Date().toISOString(),
        reviewed: false
      }
    };
    
    await store.put(mockResponse);
    await tx.done;
    logWithTimestamp('Added mock response:', mockResponse);
    return mockResponse;
  } catch (error) {
    logWithTimestamp('Failed to add mock response:', error, 'error');
    throw error;
  }
}

async function updateMockResponseStatus(key, approved) {
  try {
    const db = await ensureConnection();
    const tx = db.transaction('mockResponses', 'readwrite');
    const store = tx.objectStore('mockResponses');
    
    const mockResponse = await store.get(key);
    if (!mockResponse) {
      throw new Error(`Mock response with key '${key}' not found`);
    }
    
    mockResponse.metadata.reviewed = true;
    mockResponse.metadata.approved = approved;
    mockResponse.metadata.reviewedAt = new Date().toISOString();
    
    await store.put(mockResponse);
    await tx.done;
    logWithTimestamp('Updated mock response status:', mockResponse);
    return mockResponse;
  } catch (error) {
    logWithTimestamp('Failed to update mock response status:', error, 'error');
    throw error;
  }
}

// Update a value in a store by path
async function updateByPath(storeName, path, value) {
  logWithTimestamp(`Updating ${storeName} at path ${path}`, value);
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  // The first element in the path should be the record ID
  const recordId = path[0];
  if (!recordId) {
    throw new Error('Record ID not provided in path');
  }

  // Get the record by its ID (using find since we don't have a key-based store)
  const records = await store.getAll();
  const record = records.find(r => r.id === recordId);
  if (!record) {
    throw new Error(`Record with ID ${recordId} not found in ${storeName}`);
  }

  // Create a copy of the record to modify
  const updatedRecord = { ...record };
  let current = updatedRecord;
  
  // Navigate through the path, starting after the record ID
  for (let i = 1; i < path.length - 1; i++) {
    const key = path[i];
    if (current === undefined) {
      throw new Error(`Invalid path at segment ${key}`);
    }
    
    // Handle array indices
    if (Array.isArray(current)) {
      const index = parseInt(key);
      if (isNaN(index)) {
        throw new Error(`Invalid array index: ${key}`);
      }
      if (index < 0 || index >= current.length) {
        throw new Error(`Array index out of bounds: ${index}`);
      }
      // Make a copy of the array
      current = [...current];
      updatedRecord[path[i-1]] = current;
    } else if (typeof current === 'object' && current !== null) {
      if (!(key in current)) {
        throw new Error(`Path segment ${key} not found in record`);
      }
      // Make a copy of the object
      current[key] = current[key] === null ? null :
        Array.isArray(current[key]) ? [...current[key]] :
        typeof current[key] === 'object' ? { ...current[key] } :
        current[key];
    } else {
      throw new Error(`Cannot traverse path at ${key}: parent is not an object or array`);
    }
    current = current[key];
  }
  
  const lastKey = path[path.length - 1];
  
  if (value === undefined) {
    // Handle deletion
    if (Array.isArray(current)) {
      const index = parseInt(lastKey);
      if (isNaN(index) || index < 0 || index >= current.length) {
        throw new Error(`Invalid array index for deletion: ${lastKey}`);
      }
      current.splice(index, 1);
    } else if (typeof current === 'object' && current !== null) {
      delete current[lastKey];
    } else {
      throw new Error('Cannot delete: parent is not an object or array');
    }
  } else {
    // Handle update or addition
    if (Array.isArray(current)) {
      const index = parseInt(lastKey);
      if (isNaN(index)) {
        throw new Error(`Invalid array index: ${lastKey}`);
      }
      current[index] = value;
    } else if (typeof current === 'object' && current !== null) {
      current[lastKey] = value;
    } else {
      throw new Error('Cannot update: parent is not an object or array');
    }
  }
  
  // Store the updated record
  logWithTimestamp(`Storing updated record for ${storeName}:`, updatedRecord);
  await store.put(updatedRecord);
  await tx.done;
  
  return updatedRecord;
}

async function recordExists(storeName, id) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const records = await store.getAll();
  
  return records.some(record => record.id === id);
}

async function addRecord(storeName, record) {
  logWithTimestamp(`Adding record to ${storeName}:`, record);
  
  if (!record.id) {
    throw new Error(`Record must have an 'id' field`);
  }

  // First check if record exists using a separate transaction
  const exists = await recordExists(storeName, record.id);
  if (exists) {
    throw new Error(`Record with ID '${record.id}' already exists in ${storeName}`);
  }

  // Now handle the actual record addition in a new transaction
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  try {
    // Get all records
    const records = await store.getAll();
    const currentRecords = Array.isArray(records) ? records : [];
    
    // Add the new record
    await store.put(record);
    
    // Wait for transaction to complete
    await tx.done;
    
    logWithTimestamp(`Successfully added record to ${storeName}`);
    return [...currentRecords, record];
  } catch (error) {
    logWithTimestamp(`Error adding record to ${storeName}:`, error);
    throw error;
  }
}

async function deleteRecord(storeName, recordId) {
  logWithTimestamp(`[deleteRecord] Starting deletion from ${storeName}, ID: ${recordId}`);
  
  const db = await getDB();
  logWithTimestamp(`[deleteRecord] Got database instance`);
  
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  try {
    // Get current records
    logWithTimestamp(`[deleteRecord] Fetching current records from store`);
    const records = await store.getAll();
    logWithTimestamp(`[deleteRecord] Current records:`, records);

    if (!Array.isArray(records)) {
      throw new Error('Store data is not an array');
    }

    // Find and remove the record
    const updatedRecords = records.filter(record => record.id !== recordId);
    logWithTimestamp(`[deleteRecord] Filtered records:`, updatedRecords);
    
    if (updatedRecords.length === records.length) {
      throw new Error(`Record with ID '${recordId}' not found in ${storeName}`);
    }

    // Update the store with remaining records
    logWithTimestamp(`[deleteRecord] Clearing store`);
    await store.clear();

    if (updatedRecords.length > 0) {
      logWithTimestamp(`[deleteRecord] Adding ${updatedRecords.length} remaining records`);
      for (const record of updatedRecords) {
        await store.put(record);
      }
    } else {
      logWithTimestamp(`[deleteRecord] No records remaining after deletion`);
    }
    
    await tx.done;
    logWithTimestamp(`[deleteRecord] Transaction completed successfully`);
    return true;
  } catch (error) {
    logWithTimestamp(`[deleteRecord] Error during deletion:`, error, 'error');
    throw error;
  }
}

// Helper function to generate a mock response key
function generateMockKey(method, pathname) {
  // For Nudge endpoints, extract the Nudge ID
  if (pathname.startsWith('/api/studio/picks/nudge')) {
    const parts = pathname.split('/');
    const nudgeId = parts[parts.length - 1];
    // If it's a specific nudge (has ID), use that in the key
    if (nudgeId && nudgeId !== 'nudge') {
      const key = `mockResponses:${method}:nudge:${nudgeId}`;
      logWithTimestamp('Generated Nudge-specific key:', key, 'from pathname:', pathname);
      return key;
    }
    // For collection endpoints (no ID), use the base path
    const key = `mockResponses:${method}:nudge:collection`;
    logWithTimestamp('Generated Nudge collection key:', key, 'from pathname:', pathname);
    return key;
  }
  // For other endpoints, use the full pathname
  const key = `mockResponses:${method}:${pathname}`;
  logWithTimestamp('Generated generic key:', key, 'from pathname:', pathname);
  return key;
}

// Enhanced function to store mock response with comparison
async function storeMockResponse(request, response, responseData) {
  try {
    const db = await ensureConnection();
    const tx = db.transaction('mockResponses', 'readwrite');
    const store = tx.objectStore('mockResponses');
    
    const pathname = new URL(request.url).pathname;
    const key = generateMockKey(request.method, pathname);
    logWithTimestamp('Storing mock response with key:', key);
    
    // Check if a mock response already exists
    const existingMock = await store.get(key);
    logWithTimestamp('Existing mock for key:', key, existingMock ? 'FOUND' : 'NOT FOUND');
    
    const mockResponse = {
      key,
      request: {
        method: request.method,
        url: request.url,
        headers: headersToObject(request.headers),
        body: request.body
      },
      response: {
        status: response.status,
        headers: headersToObject(response.headers),
        body: responseData
      },
      metadata: {
        captured: new Date().toISOString(),
        reviewed: false,
        hasExistingVersion: false
      }
    };

    // If there's an existing mock, compare them
    if (existingMock) {
      logWithTimestamp('Comparing with existing mock:', {
        existing: existingMock,
        captured: mockResponse
      });
      const differences = compareMockResponses(existingMock, mockResponse);
      logWithTimestamp('Comparison results:', differences);
      mockResponse.metadata.hasExistingVersion = true;
      if (differences.hasDifferences) {
        mockResponse.metadata.differences = differences;
      } else {
        // Even if there are no differences, we still want to show the existing version
        mockResponse.metadata.differences = {
          response: {
            body: {
              existing: existingMock.response.body,
              captured: mockResponse.response.body
            },
            status: {
              existing: existingMock.response.status,
              captured: mockResponse.response.status
            }
          }
        };
      }
    }
    
    await store.put(mockResponse);
    await tx.done;
    logWithTimestamp('Successfully stored mock response:', mockResponse);
    return mockResponse;
  } catch (error) {
    logWithTimestamp('Failed to store mock response:', error, 'error');
    throw error;
  }
}

// Helper function to compare two mock responses
function compareMockResponses(existing, captured) {
  const differences = {
    request: {},
    response: {},
    hasDifferences: false
  };

  // Compare request
  if (JSON.stringify(existing.request.body) !== JSON.stringify(captured.request.body)) {
    differences.request.body = {
      existing: existing.request.body,
      captured: captured.request.body
    };
    differences.hasDifferences = true;
  }

  // Compare headers (ignoring case and certain dynamic headers)
  const ignoredHeaders = ['date', 'content-length', 'connection'];
  const existingHeaders = Object.entries(existing.request.headers || {})
    .filter(([key]) => !ignoredHeaders.includes(key.toLowerCase()))
    .reduce((acc, [k, v]) => ({ ...acc, [k.toLowerCase()]: v }), {});
  const capturedHeaders = Object.entries(captured.request.headers || {})
    .filter(([key]) => !ignoredHeaders.includes(key.toLowerCase()))
    .reduce((acc, [k, v]) => ({ ...acc, [k.toLowerCase()]: v }), {});
  
  if (JSON.stringify(existingHeaders) !== JSON.stringify(capturedHeaders)) {
    differences.request.headers = {
      existing: existingHeaders,
      captured: capturedHeaders
    };
    differences.hasDifferences = true;
  }

  // Compare response
  if (JSON.stringify(existing.response.body) !== JSON.stringify(captured.response.body)) {
    differences.response.body = {
      existing: existing.response.body,
      captured: captured.response.body
    };
    differences.hasDifferences = true;
  }

  if (existing.response.status !== captured.response.status) {
    differences.response.status = {
      existing: existing.response.status,
      captured: captured.response.status
    };
    differences.hasDifferences = true;
  }

  return differences;
}

// Separate function for storing mock responses
async function storeMockResponseOriginal(request, response, responseData) {
  try {
    const db = await ensureConnection();
    const tx = db.transaction('mockResponses', 'readwrite');
    const store = tx.objectStore('mockResponses');
    
    const key = `mockResponses:${request.method}:${new URL(request.url).pathname}`;
    
    const mockResponse = {
      key,
      request: {
        method: request.method,
        url: request.url,
        headers: headersToObject(request.headers),
        body: request.body
      },
      response: {
        status: response.status,
        headers: headersToObject(response.headers),
        body: responseData
      },
      metadata: {
        captured: new Date().toISOString(),
        reviewed: false
      }
    };
    
    await store.put(mockResponse);
    await tx.done;
    logWithTimestamp('Stored mock response:', mockResponse);
    return mockResponse;
  } catch (error) {
    logWithTimestamp('Failed to store mock response:', error, 'error');
    throw error;
  }
}

// Helper function to generate stable keys for records
function generateStableKey(storeName, record) {
  // If the record has an id field, use it
  if (record.id) {
    return `${storeName}:${record.id}`;
  }
  
  // For mock responses, use the request URL and method
  if (storeName === 'mockResponses') {
    const { method, url } = record.request;
    const urlPath = new URL(url).pathname;
    return `${storeName}:${method}:${urlPath}`;
  }
  
  // For any other stores, throw an error if no id is present
  throw new Error(`Record in store '${storeName}' must have an 'id' field`);
}

// Helper function to safely convert headers to object
function headersToObject(headers) {
  // If it's already a plain object, return it
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return {};
  }
  
  // If it's a Headers instance, use entries()
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  
  // If it's a plain object, return a copy
  return { ...headers };
}

// Export the public API
export {
  getDB,
  resetDatabase,
  getAllFromStore,
  getFromStore,
  putInStore,
  clearStore,
  logError,
  logNetwork,
  clearErrors,
  clearNetwork,
  clearMockData,
  exportDatabaseToJSON,
  importDatabaseFromJSON,
  importDatabaseFromJSONNew,
  addMockResponse,
  updateMockResponseStatus,
  storeMockResponse,
  storeMockResponseOriginal,
  updateByPath,
  recordExists,
  addRecord,
  deleteRecord
};

export default {
  getDB,
  resetDatabase,
  getAllFromStore,
  getFromStore,
  putInStore,
  clearStore,
  logError,
  logNetwork,
  clearErrors,
  clearNetwork,
  clearMockData,
  exportDatabaseToJSON,
  importDatabaseFromJSON,
  importDatabaseFromJSONNew,
  addMockResponse,
  updateMockResponseStatus,
  storeMockResponse,
  storeMockResponseOriginal,
  updateByPath,
  recordExists,
  addRecord,
  deleteRecord
};
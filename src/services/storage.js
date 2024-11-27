import { openDB } from 'idb';

const DB_NAME = 'engagement-studios';
const DB_VERSION = 3;

let dbInstance = null;

export async function getDB() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Create stores if they don't exist
        const stores = ['nudges', 'collections', 'media', 'errors', 'network'];
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: 'id',
              autoIncrement: false 
            });
            if (storeName === 'network' || storeName === 'errors') {
              store.createIndex('timestamp', 'timestamp');
            }
            console.log(`Created store: ${storeName}`);
          }
        });
      },
      blocked() {
        console.log('Database blocked');
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
      blocking() {
        console.log('Database blocking');
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
      terminated() {
        console.log('Database terminated');
        dbInstance = null;
      }
    });

    console.log('Database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Database initialization failed:', error);
    dbInstance = null;
    throw error;
  }
}

export async function getAllFromStore(storeName) {
  try {
    const db = await getDB();
    return await db.getAll(storeName);
  } catch (error) {
    console.error(`Failed to get all from ${storeName}:`, error);
    throw error;
  }
}

export async function getFromStore(storeName, id) {
  if (!id) {
    throw new Error('ID is required');
  }
  
  try {
    const db = await getDB();
    const item = await db.get(storeName, id);
    if (!item) {
      const error = new Error('Not found');
      error.status = 404;
      throw error;
    }
    return item;
  } catch (error) {
    console.error(`Failed to get ${id} from ${storeName}:`, error);
    throw error;
  }
}

export async function putInStore(storeName, item) {
  if (!item || !item.id) {
    throw new Error('Invalid item data');
  }

  try {
    const db = await getDB();
    await db.put(storeName, item);
    return item;
  } catch (error) {
    console.error(`Failed to put in ${storeName}:`, error);
    throw error;
  }
}

export async function clearStore(storeName) {
  try {
    const db = await getDB();
    await db.clear(storeName);
  } catch (error) {
    console.error(`Failed to clear ${storeName}:`, error);
    throw error;
  }
}

export async function logError(error) {
  try {
    const db = await getDB();
    await db.add('errors', {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: error.name || 'Error',
      message: error.message,
      stack: error.stack,
      url: window.location.pathname,
      status: error.status,
      statusText: error.statusText
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

export async function logNetwork(entry) {
  try {
    const db = await getDB();
    await db.add('network', {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    });
  } catch (err) {
    console.error('Failed to log network entry:', err);
  }
}

export async function clearErrors() {
  return clearStore('errors');
}

export async function clearNetwork() {
  return clearStore('network');
}
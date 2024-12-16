import { openDB } from 'idb';

const DB_NAME = 'api-definitions';
const STORE_NAME = 'definitions';
const DB_VERSION = 1;

let dbInstance = null;

async function getDB() {
  if (!dbInstance) {
    console.log('Opening API DB...');
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        console.log('Upgrading API DB...');
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbInstance;
}

export async function getAllDefinitions() {
  console.log('Getting all API definitions...');
  const db = await getDB();
  const definitions = await db.getAll(STORE_NAME);
  console.log('Retrieved definitions:', definitions);
  return definitions;
}

export async function addDefinition(definition) {
  console.log('Adding API definition:', definition);
  const db = await getDB();
  await db.put(STORE_NAME, definition);
  console.log('API definition added successfully');
}

export async function deleteDefinition(id) {
  console.log('Deleting API definition:', id);
  const db = await getDB();
  await db.delete(STORE_NAME, id);
  console.log('API definition deleted successfully');
}

export async function getDefinition(id) {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

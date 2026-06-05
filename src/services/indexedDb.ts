// src/services/indexedDb.ts

export interface OfflineAction {
  id: string; // unique offline log id
  action: "complete";
  goalId: string;
  payload: {
    note?: string;
    completed_at: string;
  };
  timestamp: number;
}

const DB_NAME = "daily-goal-tracker-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata");
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id" });
      }
    };
  });

  return dbPromise;
}

// Cache metadata helpers (for goals, stats, history data caching)
export async function getCachedMetadata(key: string): Promise<any | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("metadata", "readonly");
      const store = transaction.objectStore("metadata");
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB error reading metadata:", err);
    return null;
  }
}

export async function setCachedMetadata(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("metadata", "readwrite");
      const store = transaction.objectStore("metadata");
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB error writing metadata:", err);
  }
}

// Sync Queue helpers
export async function getPendingQueue(): Promise<OfflineAction[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("syncQueue", "readonly");
      const store = transaction.objectStore("syncQueue");
      const request = store.getAll();

      request.onsuccess = () => {
        const sorted = (request.result || []).sort((a, b) => a.timestamp - b.timestamp);
        resolve(sorted);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB error reading syncQueue:", err);
    return [];
  }
}

export async function addToSyncQueue(action: OfflineAction): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("syncQueue", "readwrite");
      const store = transaction.objectStore("syncQueue");
      const request = store.put(action);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB error adding to syncQueue:", err);
  }
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("syncQueue", "readwrite");
      const store = transaction.objectStore("syncQueue");
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB error deleting from syncQueue:", err);
  }
}

export async function getSyncAction(id: string): Promise<OfflineAction | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("syncQueue", "readonly");
      const store = transaction.objectStore("syncQueue");
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB error reading sync action:", err);
    return null;
  }
}

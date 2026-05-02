const DB_NAME = 'mit-bus-chat-db';
const STORE_NAME = 'messages';
const DB_VERSION = 1;

export interface LocalMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}

export async function openChatDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMessages(messages: LocalMessage[]) {
  const db = await openChatDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  messages.forEach(msg => store.put(msg));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllMessages(): Promise<LocalMessage[]> {
  const db = await openChatDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cleanupOldLocalMessages(maxAgeMs: number = 4 * 60 * 60 * 1000) {
  const db = await openChatDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const request = store.openCursor();
  const now = Date.now();

  request.onsuccess = (event: any) => {
    const cursor = event.target.result;
    if (cursor) {
      if (now - cursor.value.timestamp > maxAgeMs) {
        cursor.delete();
      }
      cursor.continue();
    }
  };
}

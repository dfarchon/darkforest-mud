// TODO DB_NAME at format `DarkForestChatDB-${contractAdress}-${acount}`

const DB_NAME = "DarkForestChatDB";
const STORE_NAME = "ChatHistory";
let db: IDBDatabase | null = null;

// Open Database
export const openChatDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
  });
};

// Save Message
export const saveMessageToIndexedDB = async (message: {
  message: string;
  isUser: boolean;
}) => {
  if (!db) {
    db = await openChatDatabase();
  }
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.add(message);
};

// Load Conversation
export const loadConversationFromIndexedDB = async (): Promise<
  { message: string; isUser: boolean }[]
> => {
  if (!db) {
    db = await openChatDatabase();
  }
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () =>
      resolve(request.result as { message: string; isUser: boolean }[]);
    request.onerror = () =>
      reject(new Error("Failed to load conversation from IndexedDB"));
  });
};

// Clear Chat History
export const clearChatHistoryFromIndexedDB = async (): Promise<void> => {
  if (!db) {
    db = await openChatDatabase();
  }
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to clear chat history"));
  });
};

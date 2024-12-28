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

// // Clear Chat History
// export const clearChatHistoryFromIndexedDB = async (): Promise<void> => {
//   if (!db) {
//     db = await openChatDatabase();
//   }
//   const transaction = db.transaction(STORE_NAME, "readwrite");
//   const store = transaction.objectStore(STORE_NAME);

//   return new Promise((resolve, reject) => {
//     const request = store.clear();
//     request.onsuccess = () => resolve();
//     request.onerror = () => reject(new Error("Failed to clear chat history"));
//   });
// };

export const clearChatHistoryFromIndexedDB = async (): Promise<void> => {
  if (!db) {
    db = await openChatDatabase();
  }

  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll(); // Fetch all chat history
    request.onsuccess = () => {
      const allMessages = request.result;

      if (!allMessages || allMessages.length < 1) {
        // Nothing to clear if less than one messages exist
        resolve();
        return;
      }

      const permanentMessages = allMessages.slice(0, 1); // Keep the first two messages
      const transactionClear = db.transaction(STORE_NAME, "readwrite");
      const clearStore = transactionClear.objectStore(STORE_NAME);
      const clearRequest = clearStore.clear(); // Clear the entire store

      clearRequest.onsuccess = () => {
        const transactionAdd = db.transaction(STORE_NAME, "readwrite");
        const addStore = transactionAdd.objectStore(STORE_NAME);

        // Add back the first two permanent messages
        permanentMessages.forEach((message) => {
          addStore.add(message);
        });

        transactionAdd.oncomplete = () => resolve();
        transactionAdd.onerror = () =>
          reject(new Error("Failed to restore permanent messages"));
      };

      clearRequest.onerror = () =>
        reject(new Error("Failed to clear chat history"));
    };

    request.onerror = () =>
      reject(new Error("Failed to fetch chat history for clearing"));
  });
};

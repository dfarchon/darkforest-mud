import type { Component, Components } from "@latticexyz/recs";
import { Subject } from "rxjs";

const DB_NAME = "DarkForestSyncRecDB";
const TABLE_NAME1 = "syncRecStateInfo";
const TABLE_NAME2 = "syncRecStateComponents";
let db: IDBDatabase | null = null;

export interface UpdatedStateInfo {
  snapshotStartBlock: number; // The starting block number of the snapshot
  snapshotEndBlock: number; // The ending block number of the snapshot
}

export interface SyncProgress {
  message: string; // Status message of the synchronization
  percentage: number; // Progress percentage (0 to 100)
  step: string; // Current step of the synchronization process
  latestBlockNumber: bigint; // The latest block number to be processed
  lastBlockNumberProcessed: bigint; // The last block number that has been processed
}
// Open Database and Initialize Tables
export const openDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(TABLE_NAME1)) {
        database.createObjectStore(TABLE_NAME1, { keyPath: "key" });
      }

      if (!database.objectStoreNames.contains(TABLE_NAME2)) {
        database.createObjectStore(TABLE_NAME2, { keyPath: "componentKey" });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };
  });
};

// Load State Information from TABLE_NAME1
export const loadStateInfoFromIndexedDB =
  async (): Promise<UpdatedStateInfo | null> => {
    if (!db) {
      db = await openDatabase();
    }

    const transaction = db.transaction(TABLE_NAME1, "readonly");
    const store = transaction.objectStore(TABLE_NAME1);

    return new Promise<UpdatedStateInfo | null>((resolve) => {
      const request = store.get("state");
      request.onsuccess = () => resolve(request.result as UpdatedStateInfo);
      request.onerror = () => resolve(null);
    });
  };

// Save State Information to TABLE_NAME1
export const saveStateInfoToIndexedDB = async (stateInfo: UpdatedStateInfo) => {
  if (!db) {
    db = await openDatabase();
  }

  const transaction = db.transaction(TABLE_NAME1, "readwrite");
  const store = transaction.objectStore(TABLE_NAME1);

  return new Promise<void>((resolve, reject) => {
    const request = store.put({ key: "state", ...stateInfo });
    request.onsuccess = () => resolve();
    request.onerror = (event) =>
      console.error("Failed to save state info to IndexedDB:", event);
    reject(new Error("Failed to save state info to IndexedDB"));
  });
};

// Sanitize Component for IndexedDB Storage
const sanitizeComponent = (
  component: Component,
  seen = new WeakSet(),
): undefined => {
  if (typeof component !== "object" || component === null) {
    return component; // Return primitives directly
  }

  if (seen.has(component)) {
    return "[Circular]"; // Replace circular references with a placeholder
  }

  seen.add(component);

  const sanitized = Array.isArray(component) ? [] : {};
  for (const [key, value] of Object.entries(component)) {
    if (typeof value === "function") {
      sanitized[key] = { __type: "Function", __source: value.toString() };
    } else if (typeof value === "symbol") {
      sanitized[key] = String(value);
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeComponent(value, seen);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Rehydrate Component from IndexedDB Storage
const rehydrateComponent = (component: undefined): Component => {
  if (typeof component !== "object" || component === null) {
    return component; // Return primitives directly
  }

  const rehydrated = Array.isArray(component) ? [] : {};
  for (const [key, value] of Object.entries(component)) {
    if (value === "[Circular]") {
      rehydrated[key] = null; // Replace circular references with `null`
    } else if (typeof value === "string" && value.startsWith("Symbol(")) {
      // Rehydrate Symbol
      rehydrated[key] = Symbol(value.slice(7, -1));
    } else if (
      value &&
      typeof value === "object" &&
      value.__type === "Function"
    ) {
      // Rehydrate Function
      try {
        rehydrated[key] = new Function(`return ${value.__source}`)();
      } catch (err) {
        console.error(`Failed to rehydrate function for key: ${key}`, err);
        rehydrated[key] = () => {}; // Fallback to no-op
      }
    } else if (value && value.__type === "Map") {
      // Rehydrate Map
      rehydrated[key] = new Map(value.__entries);
    } else if (value && value.__type === "Observable") {
      // Rehydrate RxJS Subject or Observable
      rehydrated[key] = new Subject(); // Adjust based on your specific Observable type
    } else if (typeof value === "object") {
      // Recursively rehydrate nested objects
      rehydrated[key] = rehydrateComponent(value);
    } else {
      // Primitive or unknown type
      rehydrated[key] = value;
    }
  }

  // Ensure the rehydrated object matches the expected structure for components
  return rehydrated;
};

// Save Components to TABLE_NAME2
export const saveComponentsToIndexedDB = async (components: Components) => {
  if (!db) {
    db = await openDatabase();
  }

  const transaction = db.transaction(TABLE_NAME2, "readwrite");
  const store = transaction.objectStore(TABLE_NAME2);

  return new Promise<void>((resolve, reject) => {
    try {
      Object.entries(components).forEach(([key, component]) => {
        const sanitizedComponent = sanitizeComponent(component);
        store.put({ componentKey: key, sanitizedComponent });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) =>
        reject(new Error("Failed to save components to IndexedDB"));
    } catch (error) {
      reject(error);
    }
  });
};

// Load Components from TABLE_NAME2
export const loadComponentsFromIndexedDB = async (): Promise<Components> => {
  if (!db) {
    db = await openDatabase();
  }

  const transaction = db.transaction(TABLE_NAME2, "readonly");
  const store = transaction.objectStore(TABLE_NAME2);

  return new Promise<Components>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const components: Components = {};
      for (const item of request.result) {
        components[item.componentKey] = rehydrateComponent(
          item.sanitizedComponent,
        );
      }
      resolve(components);
    };
    request.onerror = () =>
      reject(new Error("Failed to load components from IndexedDB"));
  });
};

// Incremental Sync
export const syncIncrementalChanges = async (
  components: Components,
  syncProgress: SyncProgress,
  genesisBlock: number,
) => {
  const { lastBlockNumberProcessed, latestBlockNumber } = syncProgress;

  console.log(
    `Syncing blocks from ${latestBlockNumber} to ${lastBlockNumberProcessed}...`,
  );

  const updatedStateInfo: UpdatedStateInfo = {
    snapshotStartBlock: genesisBlock,
    snapshotEndBlock: Number(lastBlockNumberProcessed),
  };

  await saveStateInfoToIndexedDB(updatedStateInfo);
  await saveComponentsToIndexedDB(components);

  console.log("Incremental sync completed.");
};

// Save Initial Components
export const saveInitialComponents = async (
  components: Components,
  genesisBlock: number,
  latestBlockNumber: number,
) => {
  console.log("Saving initial components...");

  await saveComponentsToIndexedDB(components);

  const initialStateInfo: UpdatedStateInfo = {
    snapshotStartBlock: genesisBlock,
    snapshotEndBlock: latestBlockNumber,
  };
  await saveStateInfoToIndexedDB(initialStateInfo);

  console.log("Initial components saved.");
};

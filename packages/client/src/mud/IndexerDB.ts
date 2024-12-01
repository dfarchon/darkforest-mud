import type { Component, Components } from "@latticexyz/recs";

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
export const loadStateInfoFromIndexedDB = async () => {
  if (!db) {
    db = await openDatabase();
  }

  const transaction = db.transaction(TABLE_NAME1, "readonly");
  const store = transaction.objectStore(TABLE_NAME1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve) => {
    const request = store.get("state");
    request.onsuccess = () => resolve(request.result);
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
    request.onsuccess = () => {
      //  console.log("State info successfully saved to IndexedDB.");
      resolve();
    };
    request.onerror = (event) => {
      console.error("Failed to save state info to IndexedDB:", event);
      reject(new Error("Failed to save state info to IndexedDB"));
    };
  });
};

export const saveComponentsToIndexedDB = async (components: Components) => {
  if (!db) {
    db = await openDatabase();
  }

  const transaction = db.transaction(TABLE_NAME2, "readwrite");
  const store = transaction.objectStore(TABLE_NAME2);

  return new Promise<void>((resolve, reject) => {
    try {
      Object.entries(components).forEach(([key, component]) => {
        // HERE SAVE TO INDEXEDDB
        const sanitizedComponent = sanitizeComponent(component);
        console.log("Component Format", component);
        console.log("sanitizedComponent Format", sanitizedComponent);
        store.put({ componentKey: key, sanitizedComponent });
      });

      transaction.oncomplete = () => {
        console.log("Components successfully saved to IndexedDB.");
        resolve();
      };

      transaction.onerror = (event) => {
        console.error("Failed to save components to IndexedDB:", event);
        reject(new Error("Failed to save components to IndexedDB"));
      };
    } catch (error) {
      console.error("Error during components save:", error);
      reject(error);
    }
  });
};

const sanitizeComponent = (
  component: Component,
  seen = new WeakSet(),
): string => {
  if (typeof component !== "object" || component === null) {
    return component; // Return primitives directly
  }

  if (seen.has(component)) {
    //  console.warn("Circular reference detected, skipping:", component);
    return "[Circular]"; // Replace circular references with a placeholder
  }

  seen.add(component);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitized: any = Array.isArray(component) ? [] : {};
  for (const [key, value] of Object.entries(component)) {
    if (typeof value === "function") {
      // console.warn(`Removed function field: ${key}`);
      sanitized[key] = undefined; // Skip functions
    } else if (typeof value === "symbol") {
      //console.warn(`Converted symbol field: ${key}`);
      sanitized[key] = String(value); // Convert symbols to strings
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeComponent(value, seen); // Recursively sanitize nested objects
    } else {
      sanitized[key] = value; // Copy primitive values
    }
  }

  return sanitized;
};
// Rehydrate components back to their usable form

const rehydrateComponent = (component: Component): unknown => {
  const rehydrated = { ...component };

  for (const [key, value] of Object.entries(rehydrated)) {
    if (value === "[Circular]") {
      //  console.warn(`Detected circular reference placeholder in ${key}`);
      rehydrated[key] = null; // Replace circular reference with `null` or another marker
    } else if (typeof value === "string" && value.startsWith("Symbol(")) {
      // Reconvert stringified symbols
      rehydrated[key] = Symbol(value.slice(7, -1));
    } else if (value && typeof value === "object") {
      // Recursively rehydrate nested objects
      rehydrated[key] = rehydrateComponent(value);
    }
  }

  return rehydrated;
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
      const components = request.result.reduce(
        (acc: unknown, item: unknown) => {
          acc[item.componentKey] = rehydrateComponent(item); // Rehydrate each component
          return acc;
        },
        {},
      );
      resolve(components);
    };
    request.onerror = () => {
      reject(new Error("Failed to load components from IndexedDB"));
    };
  });
};
// // Incremental Sync
export const syncIncrementalChanges = async (
  components: Components,
  syncProgress: SyncProgress,
  genesisBlock: number,
) => {
  const { lastBlockNumberProcessed, latestBlockNumber } = syncProgress;

  console.log(
    `Incrementally syncing from block ${latestBlockNumber} to ${lastBlockNumberProcessed}`,
  );

  console.log(`Fetching data for block ${lastBlockNumberProcessed}...`);

  const updatedStateInfo = {
    snapshotStartBlock: Number(genesisBlock),
    snapshotEndBlock: Number(lastBlockNumberProcessed),
  };

  await saveStateInfoToIndexedDB(updatedStateInfo);
  await saveComponentsToIndexedDB(components);

  console.log(`Synced block ${lastBlockNumberProcessed}.`);
};

export const saveInitialComponents = async (
  components: Components,
  genesisBlock: number,
  latestBlockNumber: number,
) => {
  console.log("Saving initial components to IndexedDB...");

  // Save all components at once
  await saveComponentsToIndexedDB(components);

  // Save state info to mark the initial synchronization
  const initialStateInfo = {
    snapshotStartBlock: genesisBlock,
    snapshotEndBlock: latestBlockNumber,
  };
  await saveStateInfoToIndexedDB(initialStateInfo);

  console.log("Initial components and state info saved.");
};

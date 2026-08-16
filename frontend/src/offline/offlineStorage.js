const DATABASE_NAME = "agrogestor-offline";
const DATABASE_VERSION = 2;
const REQUEST_STORE = "requests";
const CACHE_STORE = "responses";
const DEFAULT_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const memoryRequests = new Map();
const memoryCache = new Map();
let databasePromise;

function supportsIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDatabase() {
  if (!supportsIndexedDb()) return Promise.resolve(null);
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(REQUEST_STORE)) {
        const store = database.createObjectStore(REQUEST_STORE, {
          keyPath: "id",
        });
        store.createIndex("scope", "scope", { unique: false });
      }
      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        const store = database.createObjectStore(CACHE_STORE, {
          keyPath: "id",
        });
        store.createIndex("scope", "scope", { unique: false });
      } else {
        const store = request.transaction.objectStore(CACHE_STORE);
        if (!store.indexNames.contains("scope")) {
          store.createIndex("scope", "scope", { unique: false });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return databasePromise;
}

async function execute(storeName, mode, operation) {
  const database = await openDatabase();
  if (!database) return operation(null);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try {
      result = operation(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result?.result ?? result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function putQueuedRequest(request) {
  if (!supportsIndexedDb()) {
    memoryRequests.set(request.id, structuredClone(request));
    return;
  }
  await execute(REQUEST_STORE, "readwrite", (store) => store.put(request));
}

export async function listQueuedRequests(scope) {
  if (!supportsIndexedDb()) {
    return [...memoryRequests.values()]
      .filter((item) => item.scope === scope)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(REQUEST_STORE, "readonly");
    const index = transaction.objectStore(REQUEST_STORE).index("scope");
    const request = index.getAll(scope);
    request.onsuccess = () =>
      resolve(
        request.result.sort((left, right) =>
          left.createdAt.localeCompare(right.createdAt),
        ),
      );
    request.onerror = () => reject(request.error);
  });
}

export async function deleteQueuedRequest(id) {
  if (!supportsIndexedDb()) {
    memoryRequests.delete(id);
    return;
  }
  await execute(REQUEST_STORE, "readwrite", (store) => store.delete(id));
}

export async function updateQueuedRequest(id, changes) {
  if (!supportsIndexedDb()) {
    const current = memoryRequests.get(id);
    if (current) memoryRequests.set(id, { ...current, ...changes });
    return;
  }

  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(REQUEST_STORE, "readwrite");
    const store = transaction.objectStore(REQUEST_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      if (getRequest.result) {
        store.put({ ...getRequest.result, ...changes });
      }
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function cacheId(scope, path) {
  return `${scope}::${path}`;
}

export async function putCachedResponse(scope, path, data) {
  const entry = {
    id: cacheId(scope, path),
    scope,
    path,
    data,
    cachedAt: new Date().toISOString(),
  };
  if (!supportsIndexedDb()) {
    memoryCache.set(entry.id, structuredClone(entry));
    return;
  }
  await execute(CACHE_STORE, "readwrite", (store) => store.put(entry));
}

export async function getCachedResponse(scope, path) {
  const id = cacheId(scope, path);
  if (!supportsIndexedDb()) {
    return memoryCache.get(id)?.data ?? null;
  }

  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CACHE_STORE, "readonly");
    const request = transaction.objectStore(CACHE_STORE).get(id);
    request.onsuccess = () => resolve(request.result?.data ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function cleanupOfflineCache({
  maxAgeMs = DEFAULT_CACHE_MAX_AGE_MS,
  now = Date.now(),
} = {}) {
  const expiredBefore = now - maxAgeMs;
  if (!supportsIndexedDb()) {
    memoryCache.forEach((entry, id) => {
      if (new Date(entry.cachedAt).getTime() < expiredBefore) {
        memoryCache.delete(id);
      }
    });
    return;
  }

  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(CACHE_STORE, "readwrite");
    const store = transaction.objectStore(CACHE_STORE);
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if (new Date(cursor.value.cachedAt).getTime() < expiredBefore) {
        cursor.delete();
      }
      cursor.continue();
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function moveOfflineScope(previousScope, nextScope) {
  if (!previousScope || !nextScope || previousScope === nextScope) return;

  if (!supportsIndexedDb()) {
    memoryRequests.forEach((request, id) => {
      if (request.scope === previousScope) {
        memoryRequests.set(id, { ...request, scope: nextScope });
      }
    });
    memoryCache.forEach((entry, id) => {
      if (entry.scope === previousScope) {
        memoryCache.delete(id);
        const movedEntry = {
          ...entry,
          id: cacheId(nextScope, entry.path),
          scope: nextScope,
        };
        memoryCache.set(movedEntry.id, movedEntry);
      }
    });
    return;
  }

  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [REQUEST_STORE, CACHE_STORE],
      "readwrite",
    );
    const requestStore = transaction.objectStore(REQUEST_STORE);
    const cacheStore = transaction.objectStore(CACHE_STORE);
    const queuedRequests = requestStore.index("scope").getAll(previousScope);
    const cachedResponses = cacheStore.getAll();

    queuedRequests.onsuccess = () => {
      queuedRequests.result.forEach((request) => {
        requestStore.put({ ...request, scope: nextScope });
      });
    };
    cachedResponses.onsuccess = () => {
      cachedResponses.result
        .filter((entry) => entry.scope === previousScope)
        .forEach((entry) => {
          cacheStore.delete(entry.id);
          cacheStore.put({
            ...entry,
            id: cacheId(nextScope, entry.path),
            scope: nextScope,
          });
        });
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function resetOfflineStorageForTests() {
  memoryRequests.clear();
  memoryCache.clear();
}

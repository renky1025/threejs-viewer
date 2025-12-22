const DB_NAME = 'ftmi-viewer-cache'
const STORE_NAME = 'model-binary'
const DB_VERSION = 1

interface CacheRecord {
  key: string
  data: ArrayBuffer
  createdAt: number
  lastAccess: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDB(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available'))
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          store.createIndex('lastAccess', 'lastAccess')
        }
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to open IndexedDB'))
      }
    })
  }

  return dbPromise
}

export async function getModelData(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB()
    return await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const record = request.result as CacheRecord | undefined
        resolve(record ? record.data : null)
      }

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to read from cache'))
      }
    })
  } catch {
    return null
  }
}

export async function setModelData(key: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB()
    const now = Date.now()

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const record: CacheRecord = { key, data, createdAt: now, lastAccess: now }
      const request = store.put(record)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to write to cache'))
    })
  } catch {
    // ignore cache write errors
  }
}

export async function touchModel(key: string): Promise<void> {
  try {
    const db = await openDB()
    const now = Date.now()

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const getReq = store.get(key)

      getReq.onsuccess = () => {
        const record = getReq.result as CacheRecord | undefined
        if (!record) {
          resolve()
          return
        }
        record.lastAccess = now
        const putReq = store.put(record)
        putReq.onsuccess = () => resolve()
        putReq.onerror = () => reject(putReq.error ?? new Error('Failed to update cache'))
      }

      getReq.onerror = () => {
        reject(getReq.error ?? new Error('Failed to read cache for touch'))
      }
    })
  } catch {
    // ignore touch errors
  }
}

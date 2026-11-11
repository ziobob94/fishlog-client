const DB_NAME    = 'fishlog-offline'
const DB_VERSION = 2
const STORE      = 'outbox'
const WEATHER    = 'weather'   // ultimo meteo visto per luogo (offline)

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'localId' })
      }
      if (!db.objectStoreNames.contains(WEATHER)) {
        db.createObjectStore(WEATHER, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function withStore(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const result = fn(store)
    tx.oncomplete = () => resolve(result)
    tx.onerror    = () => reject(tx.error)
  })
}

export async function getAllOutboxItems() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result.sort((a, b) => a.createdAt - b.createdAt))
    req.onerror   = () => reject(req.error)
  })
}

export function putOutboxItem(item) {
  return withStore('readwrite', store => store.put(item))
}

export function removeOutboxItem(localId) {
  return withStore('readwrite', store => store.delete(localId))
}

// ── Cache meteo ───────────────────────────────────────────────────────────────
// Record { key, place, data, savedAt }: key = 'last' (ultimo luogo visto) oppure 'lat,lng' a 2 decimali.
export async function getWeatherCache(key) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(WEATHER, 'readonly').objectStore(WEATHER).get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror   = () => reject(req.error)
  })
}
export async function putWeatherCache(rec) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WEATHER, 'readwrite')
    tx.objectStore(WEATHER).put(rec)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

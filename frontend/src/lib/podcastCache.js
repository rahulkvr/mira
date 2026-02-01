const DB_NAME = 'mira-podcast-cache'
const STORE_NAME = 'audio'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore(mode, callback) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const result = callback(store)
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
  })
}

export async function savePodcastAudio(key, blob) {
  return withStore('readwrite', (store) => store.put(blob, key))
}

export async function getPodcastAudio(key) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDb()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function deletePodcastAudio(key) {
  return withStore('readwrite', (store) => store.delete(key))
}

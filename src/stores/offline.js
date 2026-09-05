import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'
import { getAllOutboxItems, putOutboxItem, removeOutboxItem } from '../utils/offlineDb.js'

// Un item in coda rappresenta una richiesta HTTP non ancora andata a buon
// fine: { localId, method, url, data, meta, createdAt, status, errorMsg }
// meta serve solo a chi legge la coda (es. sessions.js) per ricostruire un
// placeholder locale — questo store resta agnostico rispetto al dominio.

function isNetworkError(err) {
  return !err.response
}

export const useOfflineStore = defineStore('offline', () => {
  const online   = ref(navigator.onLine)
  const outbox   = ref([])
  const syncing  = ref(false)
  const lastSync = ref(0)

  // Notifica (item, datiRisposta) quando una richiesta in coda viene
  // sincronizzata con successo — usato da sessions.js per sostituire i
  // placeholder locali con i dati reali del server e correggere l'URL.
  const syncListeners = new Set()
  function onSynced(cb) { syncListeners.add(cb) }

  const pendingCount = computed(() => outbox.value.filter(i => i.status !== 'error').length)
  const hasErrors    = computed(() => outbox.value.some(i => i.status === 'error'))

  async function init() {
    outbox.value = await getAllOutboxItems()
    window.addEventListener('online',  () => { online.value = true;  sync() })
    window.addEventListener('offline', () => { online.value = false })
    // rete instabile: retry periodico anche senza evento 'online' esplicito
    setInterval(() => { if (online.value) sync() }, 30000)
    if (online.value) sync()
  }

  async function enqueue(method, url, data, meta = {}) {
    const item = {
      localId: crypto.randomUUID(),
      method, url, data, meta,
      createdAt: Date.now(),
      status: 'pending',
    }
    await putOutboxItem(item)
    outbox.value.push(item)
    return item
  }

  // Aggiorna il payload di un item già in coda (es. modifica di una sessione
  // creata offline, prima ancora che venga sincronizzata).
  async function patchQueuedPayload(localId, patch) {
    const item = outbox.value.find(i => i.localId === localId)
    if (!item) return null
    item.data = { ...item.data, ...patch }
    await putOutboxItem(item)
    return item
  }

  function findQueuedCreate(localSessionId) {
    return outbox.value.find(i => i.meta.kind === 'session-create' && i.localId === localSessionId)
  }

  async function sync() {
    if (syncing.value || !online.value) return
    syncing.value = true
    try {
      for (const item of [...outbox.value]) {
        if (item.status === 'error') continue
        try {
          const { data: serverData } = await api[item.method](item.url, item.data)
          await removeOutboxItem(item.localId)
          outbox.value = outbox.value.filter(i => i.localId !== item.localId)
          lastSync.value = Date.now()
          syncListeners.forEach(cb => cb(item, serverData))
        } catch (err) {
          if (isNetworkError(err)) {
            online.value = false
            break // ancora offline, riprova al prossimo giro
          }
          // errore del server (validazione, ecc.): non ha senso ritentare da solo
          item.status   = 'error'
          item.errorMsg = err.response?.data?.error || 'Errore di sincronizzazione'
          await putOutboxItem(item)
        }
      }
    } finally {
      syncing.value = false
    }
  }

  async function removeFromQueue(localId) {
    await removeOutboxItem(localId)
    outbox.value = outbox.value.filter(i => i.localId !== localId)
  }

  return {
    online, outbox, syncing, lastSync, pendingCount, hasErrors,
    init, enqueue, patchQueuedPayload, findQueuedCreate, sync, removeFromQueue, onSynced,
  }
})

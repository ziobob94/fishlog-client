import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'
import { getAllOutboxItems, putOutboxItem, removeOutboxItem } from '../utils/offlineDb.js'

// Un item in coda rappresenta una richiesta HTTP non ancora andata a buon
// fine: { localId, method, url, data, meta, createdAt, status, errorMsg }
// meta serve solo a chi legge la coda (es. sessions.js) per ricostruire un
// placeholder locale — questo store resta agnostico rispetto al dominio.

// L'utente corrente si legge da localStorage (come fa auth.js) per non creare
// una dipendenza circolare tra gli store.
function currentUserId() {
  try { return JSON.parse(localStorage.getItem('fl_user') || 'null')?._id || null } catch { return null }
}

function isNetworkError(err) {
  return !err.response
}

// Il servizio AI delle catture a voce è al limite o momentaneamente fuori uso: non è un errore della richiesta,
// resta in coda e si riprova (il server tiene un cooldown, quindi riprovare è economico).
const RETRYABLE_CODES = new Set(['ai_rate_limit', 'ai_unavailable'])
export const isRetryableAiError = err => RETRYABLE_CODES.has(err?.response?.data?.code)

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

  // La coda in IndexedDB è condivisa da tutti gli account dello stesso
  // dispositivo: ogni item porta il suo userId e qui si vedono (e si inviano)
  // solo quelli dell'utente collegato. Gli item senza userId (versioni
  // precedenti) non sono attribuibili e vengono scartati, così non finiscono
  // mai sull'account di un altro.
  async function loadForCurrentUser() {
    const uid = currentUserId()
    const all = await getAllOutboxItems()
    const mine = []
    for (const item of all) {
      if (!item.userId) await removeOutboxItem(item.localId)
      else if (uid && item.userId === uid) mine.push(item)
    }
    outbox.value = mine
  }

  // Da chiamare a login/registrazione/logout: la coda in memoria torna a
  // contenere solo gli item dell'utente attuale.
  async function reloadForUser() {
    await loadForCurrentUser()
    if (online.value) sync()
  }

  async function init() {
    await loadForCurrentUser()
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
      userId: currentUserId(),
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
        if (item.userId !== currentUserId()) continue // mai inviare con il token di un altro utente
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
          if (isRetryableAiError(err)) break // servizio AI al limite: riprova al prossimo giro
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
    init, reloadForUser, enqueue, patchQueuedPayload, findQueuedCreate, sync, removeFromQueue, onSynced,
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'
import router from '../router/index.js'
import { useOfflineStore } from './offline.js'

function isNetworkError(err) {
  return !err.response
}

// Rispecchia (lato client, solo per la visualizzazione in lista) il
// pre-save hook di Session.js sul server, che calcola questi campi solo
// quando il documento viene effettivamente salvato.
function placeholderSession(localId, payload) {
  const catches = payload.catches || []
  const best = catches.length
    ? catches.reduce((a, b) => (b.weightKg || 0) > (a.weightKg || 0) ? b : a)
    : null
  return {
    ...payload,
    _id: `local-${localId}`,
    _pending: true,
    totalCatches: catches.length,
    bestCatch: best ? `${best.species}${best.weightKg ? ` (${best.weightKg}kg)` : ''}` : undefined,
    createdAt: new Date().toISOString(),
  }
}

export const useSessionStore = defineStore('sessions', () => {
  const sessions    = ref([])
  const current     = ref(null)
  const ongoing     = ref(null)
  const loading     = ref(false)
  const error       = ref(null)
  const pagination  = ref({ page: 1, limit: 20, total: 0, pages: 0 })

  const total = computed(() => pagination.value.total)

  // Quando la coda offline sincronizza con successo, sostituisce il
  // placeholder locale con i dati reali del server e corregge l'URL se
  // l'utente è ancora sulla pagina di dettaglio del placeholder.
  useOfflineStore().onSynced((item, serverData) => {
    if (item.meta.kind === 'session-create') {
      const localFullId = `local-${item.localId}`
      sessions.value = sessions.value.map(s => s._id === localFullId ? serverData : s)
      if (current.value?._id === localFullId) {
        current.value = serverData
        if (router.currentRoute.value.params.id === localFullId) {
          router.replace(`/session/${serverData._id}`)
        }
      }
    } else if (item.meta.kind === 'session-update') {
      sessions.value = sessions.value.map(s => s._id === item.meta.sessionId ? serverData : s)
      if (current.value?._id === item.meta.sessionId) current.value = serverData
    }
  })

  // Sessioni create offline non ancora sincronizzate: vanno mostrate in
  // testa alla lista finché la coda non le manda al server.
  function pendingCreatedSessions() {
    const offline = useOfflineStore()
    return offline.outbox
      .filter(i => i.meta.kind === 'session-create')
      .map(i => placeholderSession(i.localId, i.data))
  }

  async function fetchSessions(params = {}, { append = false } = {}) {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/sessions', { params })
      const pending = append ? [] : pendingCreatedSessions()
      sessions.value  = append ? [...sessions.value, ...data.data] : [...pending, ...data.data]
      pagination.value = data.pagination
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento'
    } finally { loading.value = false }
  }

  async function fetchOngoing() {
    try {
      const { data } = await api.get('/sessions/ongoing')
      ongoing.value = data.data
      return ongoing.value
    } catch (e) {
      return null
    }
  }

  async function fetchSession(id) {
    if (id.startsWith('local-')) {
      const offline = useOfflineStore()
      const item = offline.findQueuedCreate(id.slice('local-'.length))
      current.value = item ? placeholderSession(item.localId, item.data) : null
      return current.value
    }
    loading.value = true; error.value = null
    try {
      const { data } = await api.get(`/sessions/${id}`)
      current.value = data
      return data
    } catch (e) {
      error.value = e.response?.data?.error || 'Sessione non trovata'
      return null
    } finally { loading.value = false }
  }

  async function createSession(payload) {
    loading.value = true; error.value = null
    try {
      const { data } = await api.post('/sessions', payload)
      if (data.status === 'ongoing') ongoing.value = data
      return data
    } catch (e) {
      if (!isNetworkError(e)) {
        // Il server rifiuta sempre una seconda sessione "ongoing": si allinea
        // lo stato locale così il chiamante può rimandare l'utente lì.
        if (e.response?.status === 409 && e.response.data?.ongoingId) {
          await fetchOngoing()
        }
        error.value = e.response?.data?.error || 'Errore creazione'
        return null
      }
      const offline = useOfflineStore()
      const item = await offline.enqueue('post', '/sessions', payload, { kind: 'session-create' })
      const placeholder = placeholderSession(item.localId, payload)
      sessions.value = [placeholder, ...sessions.value]
      return placeholder
    } finally { loading.value = false }
  }

  async function updateSession(id, payload) {
    // Sessione creata offline, ancora in coda: aggiorna direttamente il
    // payload in attesa invece di accodare un secondo intervento.
    if (id.startsWith('local-')) {
      const offline  = useOfflineStore()
      const localId  = id.slice('local-'.length)
      const item     = await offline.patchQueuedPayload(localId, payload)
      if (!item) return null
      const merged = placeholderSession(localId, item.data)
      sessions.value = sessions.value.map(s => s._id === id ? merged : s)
      if (current.value?._id === id) current.value = merged
      return merged
    }

    loading.value = true; error.value = null
    try {
      const { data } = await api.patch(`/sessions/${id}`, payload)
      if (current.value?._id === id) current.value = data
      sessions.value = sessions.value.map(s => s._id === id ? data : s)
      if (ongoing.value?._id === id) ongoing.value = data.status === 'ongoing' ? data : null
      return data
    } catch (e) {
      if (!isNetworkError(e)) {
        error.value = e.response?.data?.error || 'Errore aggiornamento'
        return null
      }
      const offline = useOfflineStore()
      await offline.enqueue('patch', `/sessions/${id}`, payload, { kind: 'session-update', sessionId: id })
      const merged = { ...(current.value?._id === id ? current.value : {}), ...payload, _id: id, _pending: true }
      if (current.value?._id === id) current.value = merged
      sessions.value = sessions.value.map(s => s._id === id ? merged : s)
      return merged
    } finally { loading.value = false }
  }

  async function deleteSession(id) {
    if (id.startsWith('local-')) {
      const offline = useOfflineStore()
      await offline.removeFromQueue(id.slice('local-'.length)) // nessuna richiesta era mai partita
      sessions.value = sessions.value.filter(s => s._id !== id)
      if (current.value?._id === id) current.value = null
      return true
    }
    try {
      await api.delete(`/sessions/${id}`)
      sessions.value = sessions.value.filter(s => s._id !== id)
      if (current.value?._id === id) current.value = null
      if (ongoing.value?._id === id) ongoing.value = null
      return true
    } catch (e) {
      error.value = 'Errore eliminazione'
      return false
    }
  }

  async function uploadMedia(sessionId, files, onProgress) {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    try {
      // Niente Content-Type esplicito: senza il boundary generato dal browser
      // per il FormData, il multipart non è più parsabile lato server.
      const { data } = await api.post(`/media/upload/${sessionId}`, fd, {
        onUploadProgress: onProgress
      })
      await fetchSession(sessionId)
      return data.uploaded
    } catch (e) {
      error.value = 'Errore upload media'
      return []
    }
  }

  // Foto/video scelti per una cattura mentre si compila il form (quindi
  // ancora senza sessione salvata): vanno caricati subito dopo il salvataggio,
  // una volta noti gli _id reali delle catture appena create.
  async function uploadCatchMedia(sessionId, catchId, files) {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    try {
      // Niente Content-Type esplicito: senza il boundary generato dal browser
      // per il FormData, il multipart non è più parsabile lato server.
      const { data } = await api.post(`/media/upload/${sessionId}/catch/${catchId}`, fd)
      return data.uploaded
    } catch (e) {
      error.value = 'Errore upload foto cattura'
      return []
    }
  }

  async function deleteMedia(sessionId, mediaId) {
    try {
      await api.delete(`/media/${sessionId}/${mediaId}`)
      if (current.value?._id === sessionId) {
        current.value.media = current.value.media.filter(m => m._id !== mediaId)
      }
      return true
    } catch (e) {
      error.value = 'Errore eliminazione media'
      return false
    }
  }

  return {
    sessions, current, ongoing, loading, error, pagination, total,
    fetchSessions, fetchSession, fetchOngoing, createSession, updateSession,
    deleteSession, uploadMedia, uploadCatchMedia, deleteMedia
  }
})

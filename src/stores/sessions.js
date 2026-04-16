import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'

export const useSessionStore = defineStore('sessions', () => {
  const sessions    = ref([])
  const current     = ref(null)
  const loading     = ref(false)
  const error       = ref(null)
  const pagination  = ref({ page: 1, limit: 20, total: 0, pages: 0 })

  const total = computed(() => pagination.value.total)

  async function fetchSessions(params = {}) {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/sessions', { params })
      sessions.value  = data.data
      pagination.value = data.pagination
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento'
    } finally { loading.value = false }
  }

  async function fetchSession(id) {
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
      return data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore creazione'
      return null
    } finally { loading.value = false }
  }

  async function updateSession(id, payload) {
    loading.value = true; error.value = null
    try {
      const { data } = await api.patch(`/sessions/${id}`, payload)
      if (current.value?._id === id) current.value = data
      return data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore aggiornamento'
      return null
    } finally { loading.value = false }
  }

  async function deleteSession(id) {
    try {
      await api.delete(`/sessions/${id}`)
      sessions.value = sessions.value.filter(s => s._id !== id)
      if (current.value?._id === id) current.value = null
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
      const { data } = await api.post(`/media/upload/${sessionId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      })
      await fetchSession(sessionId)
      return data.uploaded
    } catch (e) {
      error.value = 'Errore upload media'
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
    sessions, current, loading, error, pagination, total,
    fetchSessions, fetchSession, createSession, updateSession,
    deleteSession, uploadMedia, deleteMedia
  }
})

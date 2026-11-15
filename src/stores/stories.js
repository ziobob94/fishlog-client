import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'
import i18n from '../i18n/index.js'
import { compressImage, uploadErrorMessage } from '../utils/image.js'

// Storie a 24 ore: elenco per autore (fila in Community), creazione e visualizzazione.
export const useStoryStore = defineStore('stories', () => {
  const groups = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchRail() {
    loading.value = true
    try {
      const { data } = await api.get('/stories')
      groups.value = data.data || []
    } catch { /* la fila è opzionale: se il server non risponde resta vuota */
      groups.value = []
    } finally { loading.value = false }
  }

  async function fetchUser(userId) {
    const { data } = await api.get(`/stories/user/${userId}`)
    return data.data
  }

  // Se la storia è stata creata ma il file non è salito, l'id resta qui: «Riprova» ricarica solo il file,
  // «Elimina la storia» la rimuove.
  const draftId = ref(null)

  async function create({ audience, stickers, file, onProgress }) {
    error.value = null
    try {
      let data = draftId.value ? { _id: draftId.value } : null
      if (!data) {
        data = (await api.post('/stories', { audience, stickers })).data
        draftId.value = data._id
      }
      if (file) {
        const form = new FormData()
        form.append('file', await compressImage(file))
        await api.post(`/stories/${data._id}/media`, form, {
          onUploadProgress: e => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)) }
        })
      }
      draftId.value = null
      await fetchRail()
      return data
    } catch (e) {
      error.value = uploadErrorMessage(e, i18n.global.t)
      return null
    }
  }

  async function discardDraft() {
    const id = draftId.value
    draftId.value = null
    error.value = null
    if (id) { try { await api.delete(`/stories/${id}`) } catch { /* già assente */ } }
  }

  const markViewed = id => api.post(`/stories/${id}/view`).catch(() => {})
  async function toggleLike(id) { const { data } = await api.post(`/stories/${id}/like`); return data.liked }
  async function remove(id) { await api.delete(`/stories/${id}`); await fetchRail() }

  return { groups, loading, error, draftId, fetchRail, fetchUser, create, discardDraft, markViewed, toggleLike, remove }
})

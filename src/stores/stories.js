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

  async function create({ audience, stickers, file }) {
    error.value = null
    try {
      const { data } = await api.post('/stories', { audience, stickers })
      if (file) {
        const form = new FormData()
        form.append('file', await compressImage(file))
        await api.post(`/stories/${data._id}/media`, form)
      }
      await fetchRail()
      return data
    } catch (e) {
      error.value = uploadErrorMessage(e, i18n.global.t)
      return null
    }
  }

  const markViewed = id => api.post(`/stories/${id}/view`).catch(() => {})
  async function toggleLike(id) { const { data } = await api.post(`/stories/${id}/like`); return data.liked }
  async function remove(id) { await api.delete(`/stories/${id}`); await fetchRail() }

  return { groups, loading, error, fetchRail, fetchUser, create, markViewed, toggleLike, remove }
})

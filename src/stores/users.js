import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const useUserStore = defineStore('users', () => {
  const results = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function searchUsers(search) {
    if (!search || search.trim().length < 2) { results.value = []; return results.value }
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/users', { params: { search: search.trim() } })
      results.value = data.data
      return results.value
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore ricerca utenti'
      return []
    } finally { loading.value = false }
  }

  async function fetchUser(id) {
    try {
      const { data } = await api.get(`/users/${id}`)
      return data
    } catch (e) {
      return null
    }
  }

  // Classifica catture: GET /users/:id/catches (lancia in caso di errore, la pagina mostra «Riprova»)
  async function fetchUserCatches(id, params = {}) {
    const { data } = await api.get(`/users/${id}/catches`, { params })
    return data
  }

  return { results, loading, error, searchUsers, fetchUser, fetchUserCatches }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const usePostStore = defineStore('posts', () => {
  const feed       = ref([])
  const current    = ref(null)
  const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })
  const loading     = ref(false)
  const error       = ref(null)
  const unread      = ref({ feed: 0, board: 0 })

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/posts/unread-count')
      unread.value = data
    } catch (e) { /* badge non critico */ }
  }

  // Da chiamare quando l'utente apre davvero la bacheca (non solo passandoci
  // sopra col mouse): azzera il relativo contatore anche localmente, senza
  // aspettare il prossimo fetchUnreadCount.
  async function markSeen(scope) {
    unread.value = { ...unread.value, [scope]: 0 }
    try { await api.post('/posts/mark-seen', { scope }) } catch (e) { /* non critico */ }
  }

  async function fetchPosts(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/posts', { params })
      feed.value = data.data
      pagination.value = data.pagination
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento bacheca'
    } finally { loading.value = false }
  }

  async function fetchPost(id) {
    loading.value = true
    try {
      const { data } = await api.get(`/posts/${id}`)
      current.value = data
      return data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento post'
    } finally { loading.value = false }
  }

  async function createPost(payload) {
    const { data } = await api.post('/posts', payload)
    feed.value.unshift(data)
    return data
  }

  async function updatePost(id, payload) {
    const { data } = await api.patch(`/posts/${id}`, payload)
    feed.value = feed.value.map(p => p._id === id ? data : p)
    if (current.value?._id === id) current.value = data
    return data
  }

  async function deletePost(id) {
    await api.delete(`/posts/${id}`)
    feed.value = feed.value.filter(p => p._id !== id)
  }

  async function respond(id, message) {
    const { data } = await api.post(`/posts/${id}/responses`, { message })
    if (current.value?._id === id) current.value.responses.push(data)
    return data
  }

  async function setEventStatus(id, status) {
    const { data } = await api.patch(`/posts/${id}/status`, { status })
    feed.value = feed.value.map(p => p._id === id ? data : p)
    if (current.value?._id === id) current.value = data
    return data
  }

  return {
    feed, current, pagination, loading, error, unread,
    fetchPosts, fetchPost, createPost, updatePost, deletePost, respond, setEventStatus,
    fetchUnreadCount, markSeen
  }
})

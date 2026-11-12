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

  async function fetchPosts(params = {}, { append = false } = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/posts', { params })
      feed.value = append ? [...feed.value, ...data.data] : data.data
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

  // Le risposte che sostituiscono l'intero post non portano `saved` (è del
  // solo utente corrente): lo si conserva dalla copia già in lista.
  const keepSaved = (id, data) => ({ ...data, saved: feed.value.find(p => p._id === id)?.saved ?? current.value?.saved ?? false })

  async function toggleSave(id) {
    const { data } = await api.post(`/posts/${id}/save`)
    const post = feed.value.find(p => p._id === id)
    if (post) post.saved = data.saved
    if (current.value?._id === id) current.value.saved = data.saved
    return data
  }

  async function updatePost(id, payload) {
    const { data: raw } = await api.patch(`/posts/${id}`, payload)
    const data = keepSaved(id, raw)
    feed.value = feed.value.map(p => p._id === id ? data : p)
    if (current.value?._id === id) current.value = data
    return data
  }

  async function deletePost(id) {
    await api.delete(`/posts/${id}`)
    feed.value = feed.value.filter(p => p._id !== id)
  }

  async function addComment(id, message, parentId) {
    const { data } = await api.post(`/posts/${id}/comments`, { message, parentId })
    const post = feed.value.find(p => p._id === id)
    if (post) post.comments = [...(post.comments || []), data]
    if (current.value?._id === id) current.value.comments = [...(current.value.comments || []), data]
    return data
  }

  async function deleteComment(id, commentId) {
    await api.delete(`/posts/${id}/comments/${commentId}`)
    const post = feed.value.find(p => p._id === id)
    // Il server elimina anche le risposte del commento
    const keep = c => c._id !== commentId && c.parent !== commentId
    if (post) post.comments = post.comments.filter(keep)
    if (current.value?._id === id) current.value.comments = current.value.comments.filter(keep)
  }

  async function toggleCommentLike(id, commentId) {
    const { data } = await api.post(`/posts/${id}/comments/${commentId}/like`)
    return data
  }

  async function reactToComment(id, commentId, emoji) {
    const { data } = await api.post(`/posts/${id}/comments/${commentId}/reactions`, { emoji })
    return data
  }

  // Il server risponde solo con {liked, count}: qui si ricostruisce
  // localmente l'array "likes" (stesso campo popolato dal GET iniziale)
  // aggiungendo/togliendo l'id dell'utente corrente, così la UI resta
  // coerente sia appena caricata la bacheca sia dopo un toggle.
  async function toggleLike(id, myUserId) {
    const { data } = await api.post(`/posts/${id}/like`)
    const apply = (post) => {
      if (!post) return
      post.likes = data.liked
        ? [...(post.likes || []).filter(u => u !== myUserId), myUserId]
        : (post.likes || []).filter(u => u !== myUserId)
    }
    apply(feed.value.find(p => p._id === id))
    if (current.value?._id === id) apply(current.value)
    return data
  }

  async function respond(id, message) {
    const { data } = await api.post(`/posts/${id}/responses`, { message })
    const post = feed.value.find(p => p._id === id)
    if (post) post.responses = [...(post.responses || []), data]
    if (current.value?._id === id) current.value.responses = [...(current.value.responses || []), data]
    return data
  }

  async function setAttendance(id, status, guests) {
    const { data: raw } = await api.post(`/posts/${id}/attendance`, { status, guests })
    const data = keepSaved(id, raw)
    feed.value = feed.value.map(p => p._id === id ? data : p)
    if (current.value?._id === id) current.value = data
    return data
  }

  async function setEventStatus(id, status) {
    const { data: raw } = await api.patch(`/posts/${id}/status`, { status })
    const data = keepSaved(id, raw)
    feed.value = feed.value.map(p => p._id === id ? data : p)
    if (current.value?._id === id) current.value = data
    return data
  }

  return {
    feed, current, pagination, loading, error, unread,
    fetchPosts, fetchPost, createPost, updatePost, deletePost, respond, setEventStatus, setAttendance,
    fetchUnreadCount, markSeen, addComment, deleteComment, toggleCommentLike, reactToComment, toggleLike, toggleSave
  }
})

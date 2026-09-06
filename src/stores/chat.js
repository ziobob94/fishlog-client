import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const messages      = ref([])
  const unreadCount    = ref(0)
  const loading        = ref(false)
  const error          = ref(null)

  async function fetchConversations() {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/chat/conversations')
      conversations.value = data.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento conversazioni'
    } finally { loading.value = false }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/chat/unread-count')
      unreadCount.value = data.count
    } catch (e) { /* badge non critico */ }
  }

  // Restituisce l'id della conversazione con questo amico, creandola al
  // volo lato server se non esiste ancora (nessuno scambio di messaggi finora).
  async function openConversationWith(userId) {
    const { data } = await api.get(`/chat/with/${userId}`)
    return data._id
  }

  async function fetchMessages(conversationId) {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get(`/chat/${conversationId}/messages`)
      messages.value = data.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento messaggi'
    } finally { loading.value = false }
  }

  async function sendMessage(userId, body) {
    try {
      const { data } = await api.post(`/chat/with/${userId}/messages`, { body })
      messages.value = [...messages.value, data]
      return data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore invio messaggio'
      return null
    }
  }

  async function markRead(conversationId) {
    try { await api.post(`/chat/${conversationId}/read`) } catch (e) { /* non critico */ }
  }

  // Aggiornamento realtime del badge via websocket, senza rifare la fetch.
  function setUnreadCount(count) {
    unreadCount.value = count
  }

  return {
    conversations, messages, unreadCount, loading, error,
    fetchConversations, fetchUnreadCount, openConversationWith, fetchMessages, sendMessage, markRead,
    setUnreadCount
  }
})

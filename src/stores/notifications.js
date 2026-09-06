import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const useNotificationStore = defineStore('notifications', () => {
  const items       = ref([])
  const unreadCount = ref(0)
  const loading     = ref(false)
  const error       = ref(null)

  async function fetchNotifications() {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/notifications')
      items.value = data.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento notifiche'
    } finally { loading.value = false }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/notifications/unread-count')
      unreadCount.value = data.count
    } catch (e) { /* badge non critico */ }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      const item = items.value.find(n => n._id === id)
      if (item && !item.read) {
        item.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (e) { /* non critico */ }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      items.value.forEach(n => { n.read = true })
      unreadCount.value = 0
    } catch (e) { /* non critico */ }
  }

  // Evento ricevuto via websocket: prepend in cima alla lista e incrementa il badge.
  function applyRealtimeEvent(notification) {
    items.value = [notification, ...items.value]
    unreadCount.value += 1
  }

  // La chat è stata letta aprendo direttamente la conversazione (non dal
  // centro notifiche): allinea localmente le notifiche "nuovo messaggio"
  // di quella conversazione, così il badge e la lista restano coerenti.
  function markConversationRead(conversationId, count) {
    items.value.forEach(n => {
      if (n.type === 'chat_message' && n.data?.conversationId === conversationId) n.read = true
    })
    unreadCount.value = count
  }

  return {
    items, unreadCount, loading, error,
    fetchNotifications, fetchUnreadCount, markRead, markAllRead, applyRealtimeEvent, markConversationRead
  }
})

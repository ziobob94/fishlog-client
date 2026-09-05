import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const useFriendStore = defineStore('friends', () => {
  const friends  = ref([])
  const received = ref([])
  const sent     = ref([])
  const loading  = ref(false)
  const error    = ref(null)

  async function fetchFriends() {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/friends')
      friends.value = data.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento amici'
    } finally { loading.value = false }
  }

  async function fetchRequests() {
    loading.value = true; error.value = null
    try {
      const { data } = await api.get('/friends/requests')
      received.value = data.received
      sent.value     = data.sent
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento richieste'
    } finally { loading.value = false }
  }

  async function fetchStatus(userId) {
    try {
      const { data } = await api.get(`/friends/${userId}/status`)
      return data
    } catch (e) {
      return { status: 'none' }
    }
  }

  async function fetchCommonGroups(userId) {
    try {
      const { data } = await api.get(`/friends/${userId}/common-groups`)
      return data.data
    } catch (e) {
      return []
    }
  }

  async function sendRequest(userId) {
    try {
      await api.post('/friends/requests', { userId })
      return true
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore invio richiesta'
      return false
    }
  }

  async function acceptRequest(requestId) {
    await api.post(`/friends/requests/${requestId}/accept`)
    received.value = received.value.filter(r => r._id !== requestId)
    await fetchFriends()
  }

  async function declineRequest(requestId) {
    await api.delete(`/friends/requests/${requestId}`)
    received.value = received.value.filter(r => r._id !== requestId)
    sent.value = sent.value.filter(r => r._id !== requestId)
  }

  async function removeFriend(userId) {
    await api.delete(`/friends/${userId}`)
    friends.value = friends.value.filter(f => f._id !== userId)
  }

  return {
    friends, received, sent, loading, error,
    fetchFriends, fetchRequests, fetchStatus, fetchCommonGroups,
    sendRequest, acceptRequest, declineRequest, removeFriend
  }
})

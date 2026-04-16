import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const useGroupStore = defineStore('groups', () => {
  const groups  = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchGroups() {
    loading.value = true
    try {
      const { data } = await api.get('/groups')
      groups.value = data
    } catch (e) {
      error.value = e.response?.data?.error || 'Errore caricamento gruppi'
    } finally { loading.value = false }
  }

  async function createGroup(name, description) {
    const { data } = await api.post('/groups', { name, description })
    groups.value.unshift(data)
    return data
  }

  async function addMember(groupId, userId) {
    await api.post(`/groups/${groupId}/members`, { userId })
    await fetchGroups()
  }

  async function removeMember(groupId, userId) {
    await api.delete(`/groups/${groupId}/members/${userId}`)
    await fetchGroups()
  }

  async function deleteGroup(groupId) {
    await api.delete(`/groups/${groupId}`)
    groups.value = groups.value.filter(g => g._id !== groupId)
  }

  return { groups, loading, error, fetchGroups, createGroup, addMember, removeMember, deleteGroup }
})
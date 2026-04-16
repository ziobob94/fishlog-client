import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('fl_token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('fl_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t, u) {
    token.value = t
    user.value  = u
    localStorage.setItem('fl_token', t)
    localStorage.setItem('fl_user', JSON.stringify(u))
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
  }

  function clearAuth() {
    token.value = null
    user.value  = null
    localStorage.removeItem('fl_token')
    localStorage.removeItem('fl_user')
    delete api.defaults.headers.common['Authorization']
  }

  function initAuth() {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    setAuth(data.token, data.user)
    return data.user
  }

  async function register(email, password, displayName) {
    const { data } = await api.post('/auth/register', { email, password, displayName })
    setAuth(data.token, data.user)
    return data.user
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me')
    user.value = data
    localStorage.setItem('fl_user', JSON.stringify(data))
    return data
  }

  function logout() {
    clearAuth()
  }

  return { token, user, isLoggedIn, setAuth, clearAuth, initAuth, login, register, fetchMe, logout }
})
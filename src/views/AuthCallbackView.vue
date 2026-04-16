<template>
  <div class="auth-page">
    <div class="card" style="padding:2rem;text-align:center">
      <div class="spinner" style="margin:0 auto 1rem"></div>
      <p class="text-muted">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../utils/api.js'

const router  = useRouter()
const auth    = useAuthStore()
const message = ref('Accesso in corso...')

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const token  = params.get('token')

  if (!token) {
    message.value = 'Errore: token mancante'
    setTimeout(() => router.push('/login'), 2000)
    return
  }

  try {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const { data: user } = await api.get('/auth/me')
    auth.setAuth(token, user)
    router.push('/')
  } catch {
    message.value = 'Errore di autenticazione'
    setTimeout(() => router.push('/login'), 2000)
  }
})
</script>

<style scoped>
.auth-page { @apply flex items-center justify-center min-h-[80vh]; }
</style>
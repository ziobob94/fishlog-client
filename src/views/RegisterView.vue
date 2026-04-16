<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-logo">🎣 FishLog</div>
      <h2>Crea account</h2>

      <div class="oauth-buttons">
        <a :href="apiBase + '/auth/google'" class="btn btn-oauth">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Registrati con Google
        </a>
        <a :href="apiBase + '/auth/facebook'" class="btn btn-oauth">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Registrati con Facebook
        </a>
      </div>

      <div class="divider"><span>oppure</span></div>

      <form @submit.prevent="handleRegister">
        <div class="form-group mb-1">
          <label>Nome</label>
          <input v-model="displayName" type="text" placeholder="Mario Rossi" />
        </div>
        <div class="form-group mb-1">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="tu@email.com" required />
        </div>
        <div class="form-group mb-2">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="min. 6 caratteri" required />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="spinner" style="width:15px;height:15px"></span>
          {{ loading ? 'Registrazione...' : 'Crea account' }}
        </button>
      </form>

      <p class="auth-switch">
        Hai già un account?
        <RouterLink to="/login">Accedi</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const auth        = useAuthStore()
const router      = useRouter()
const displayName = ref('')
const email       = ref('')
const password    = ref('')
const loading     = ref(false)
const error       = ref('')

const apiBase = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api`

async function handleRegister() {
  loading.value = true; error.value = ''
  try {
    await auth.register(email.value, password.value, displayName.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Errore registrazione'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page  { @apply flex items-center justify-center min-h-[80vh]; }
.auth-card  { @apply max-w-sm w-full p-8; }
.auth-logo  { @apply text-2xl font-extrabold mb-1; }
.btn-oauth  {
  @apply flex items-center justify-center gap-2.5 bg-surface-2 border border-border
         rounded-sm text-foam text-sm font-semibold px-4 py-2.5
         transition-colors duration-200 hover:border-ocean;
}
.divider {
  @apply flex items-center gap-3 text-muted text-xs my-5;
}
.divider::before, .divider::after { content: ''; @apply flex-1 h-px bg-border; }
.error-msg {
  @apply bg-danger/10 border border-danger rounded-sm text-danger text-sm px-3 py-2 mb-3;
}
.auth-switch { @apply text-muted text-sm text-center mt-5; }
</style>
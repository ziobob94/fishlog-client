<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-logo" style="display:inline-flex;align-items:center;gap:.4rem"><Fish :size="22" /> FishLog</div>
      <h2>{{ t('forgotPassword.title') }}</h2>

      <template v-if="!features.passwordAuthEnabled">
        <p class="coming-soon">
          <span class="badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
          {{ t('forgotPassword.disabled') }}
        </p>
      </template>
      <template v-else-if="sent">
        <p class="success-msg">{{ t('forgotPassword.sent') }}</p>
      </template>
      <form v-else @submit.prevent="handleSubmit">
        <p class="text-muted text-sm mb-3">{{ t('forgotPassword.text') }}</p>
        <div class="form-group mb-2">
          <label>{{ t('login.emailLabel') }}</label>
          <input v-model="email" type="email" :placeholder="t('login.emailPlaceholder')" required />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? t('forgotPassword.sending') : t('forgotPassword.submit') }}
        </button>
      </form>

      <p class="auth-switch">
        <RouterLink to="/login">{{ t('common.back') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useFeaturesStore } from '../stores/features.js'

const { t } = useI18n()
const auth  = useAuthStore()
const features = useFeaturesStore()

const email   = ref('')
const loading = ref(false)
const error   = ref('')
const sent    = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.forgotPassword(email.value)
    sent.value = true
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error')
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-page  { @apply flex items-center justify-center min-h-[80vh]; }
.auth-card  { @apply max-w-sm w-full p-8; }
.auth-logo  { @apply text-2xl font-extrabold mb-1; }
.error-msg  { @apply bg-danger/10 border border-danger rounded-sm text-danger text-sm px-3 py-2 mb-3; }
.success-msg { @apply bg-success/10 border border-success rounded-sm text-success text-sm px-3 py-2; }
.auth-switch { @apply text-muted text-sm text-center mt-5; }
.coming-soon { @apply flex items-center gap-2 text-muted text-sm; }
</style>

<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-logo" style="display:inline-flex;align-items:center;gap:.4rem"><Fish :size="22" /> FishLog</div>
      <h2>{{ t('resetPassword.title') }}</h2>

      <template v-if="!token">
        <p class="error-msg">{{ t('resetPassword.missingToken') }}</p>
      </template>
      <template v-else-if="done">
        <p class="success-msg">{{ t('resetPassword.success') }}</p>
        <RouterLink to="/login" class="btn btn-primary w-full mt-3 text-center">{{ t('common.login') }}</RouterLink>
      </template>
      <form v-else @submit.prevent="handleSubmit">
        <div class="form-group mb-2">
          <label>{{ t('resetPassword.newPasswordLabel') }}</label>
          <PasswordInput v-model="newPassword" required />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? t('profile.account.saving') : t('resetPassword.submit') }}
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
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import PasswordInput from '../components/PasswordInput.vue'

const { t } = useI18n()
const auth  = useAuthStore()
const route = useRoute()

const token       = route.query.token || ''
const newPassword = ref('')
const loading     = ref(false)
const error       = ref('')
const done        = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.resetPassword(token, newPassword.value)
    done.value = true
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
</style>

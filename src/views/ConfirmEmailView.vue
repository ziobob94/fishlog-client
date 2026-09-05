<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-logo" style="display:inline-flex;align-items:center;gap:.4rem"><Fish :size="22" /> FishLog</div>
      <h2>{{ t('confirmEmail.title') }}</h2>

      <p v-if="status === 'ok'" class="success-msg">{{ t('confirmEmail.success') }}</p>
      <p v-else class="error-msg">{{ t('confirmEmail.error') }}</p>

      <RouterLink to="/login" class="btn btn-primary w-full mt-3 text-center">{{ t('common.login') }}</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const status = route.query.status || 'error'
</script>

<style scoped>
.auth-page  { @apply flex items-center justify-center min-h-[80vh]; }
.auth-card  { @apply max-w-sm w-full p-8; }
.auth-logo  { @apply text-2xl font-extrabold mb-1; }
.error-msg  { @apply bg-danger/10 border border-danger rounded-sm text-danger text-sm px-3 py-2; }
.success-msg { @apply bg-success/10 border border-success rounded-sm text-success text-sm px-3 py-2; }
</style>

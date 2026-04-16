<template>
  <div>
    <div class="page-header">
      <RouterLink to="/" class="btn btn-ghost btn-sm">← Indietro</RouterLink>
      <h2>Nuova uscita</h2>
    </div>

    <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

    <SessionForm :saving="store.loading" @submit="onSubmit" @cancel="router.push('/')" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useSessionStore } from '../stores/sessions.js'
import SessionForm from '../components/SessionForm.vue'

const store  = useSessionStore()
const router = useRouter()
const error  = computed(() => store.error)

async function onSubmit(payload) {
  const session = await store.createSession(payload)
  if (session) router.push(`/session/${session._id}`)
}
</script>

<style scoped>
.page-header  { @apply flex items-center gap-4 mb-7; }
.error-banner { @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4; }
.state-center { @apply flex items-center justify-center p-16; }
</style>

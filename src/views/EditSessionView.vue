<template>
  <div>
    <div class="page-header">
      <RouterLink :to="`/session/${route.params.id}`" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
      <h2>{{ t('session.edit.title') }}</h2>
    </div>

    <div v-if="store.loading && !store.current" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-banner">⚠️ {{ error }}</div>

    <SessionForm
      v-else-if="store.current"
      :initial-data="store.current"
      :saving="store.loading"
      :is-edit="true"
      @submit="onSubmit"
      @cancel="router.push(`/session/${route.params.id}`)"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../stores/sessions.js'
import SessionForm from '../components/form/SessionForm.vue'

const { t }  = useI18n()
const store  = useSessionStore()
const router = useRouter()
const route  = useRoute()
const error  = computed(() => store.error)

onMounted(() => store.fetchSession(route.params.id))

async function onSubmit(payload) {
  const session = await store.updateSession(route.params.id, payload)
  if (session) router.push(`/session/${route.params.id}`)
}
</script>

<style scoped>
.page-header  { @apply flex items-center gap-4 mb-7; }
.error-banner { @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4; }
.state-center { @apply flex items-center justify-center p-16; }
</style>
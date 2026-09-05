<template>
  <div>
    <div class="page-header">
      <RouterLink :to="`/session/${route.params.id}`" class="btn btn-ghost btn-sm icon-inline">
        <FileText :size="14" /> {{ t('session.edit.viewSummary') }}
      </RouterLink>
      <h2>{{ store.current?.status === 'ongoing' ? t('session.ongoing.title') : t('session.edit.title') }}</h2>
    </div>

    <div v-if="store.loading && !store.current" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-banner" style="display:inline-flex;align-items:center;gap:.4rem"><AlertTriangle :size="16" /> {{ error }}</div>

    <!-- Uscita in corso: solo la scheda di aggiunta cattura, mai il form
         completo — quello resta riservato alla modifica di uscite chiuse. -->
    <OngoingCatchForm
      v-else-if="store.current?.status === 'ongoing'"
      :session="store.current"
      @cancel="router.push(`/session/${route.params.id}`)"
      @closed="onClosed"
    />

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
import { AlertTriangle, FileText } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'
import SessionForm from '../components/form/SessionForm.vue'
import OngoingCatchForm from '../components/form/OngoingCatchForm.vue'

const { t }  = useI18n()
const store  = useSessionStore()
const router = useRouter()
const route  = useRoute()
const error  = computed(() => store.error)

onMounted(() => store.fetchSession(route.params.id))

function onClosed() {
  router.push(`/session/${route.params.id}`)
}

async function onSubmit(payload, pendingPhotosByIndex) {
  const session = await store.updateSession(route.params.id, payload)
  if (!session) return

  if (pendingPhotosByIndex?.size) {
    for (const [index, files] of pendingPhotosByIndex) {
      const catchId = session.catches?.[index]?._id
      if (catchId && files.length) await store.uploadCatchMedia(session._id, catchId, files)
    }
    await store.fetchSession(route.params.id)
  }

  router.push(`/session/${route.params.id}`)
}
</script>

<style scoped>
.page-header  { @apply flex items-center gap-4 mb-7; }
.icon-inline  { display: inline-flex; align-items: center; gap: .35rem; }
.error-banner { @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4; }
.state-center { @apply flex items-center justify-center p-16; }
</style>
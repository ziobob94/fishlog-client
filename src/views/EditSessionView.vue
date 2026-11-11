<template>
  <div>
    <PageHeader :title="store.current?.status === 'ongoing' && !showFullForm ? '' : t('session.edit.title')" back close-icon>
      <RouterLink :to="`/session/${route.params.id}`" class="ph-icon" :aria-label="t('session.edit.viewSummary')"><FileText :size="18" /><span class="ph-label">{{ t('session.edit.viewSummary') }}</span></RouterLink>
      <button v-if="store.current?.status === 'ongoing' && !showFullForm" type="button" class="ph-icon" @click="showFullForm = true">
        <MoreHorizontal :size="18" /><span class="ph-label">{{ t('session.ongoing.dataLink') }}</span>
      </button>
    </PageHeader>

    <div v-if="store.loading && !store.current" class="state-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-banner" style="display:inline-flex;align-items:center;gap:.4rem"><AlertTriangle :size="16" /> {{ error }}</div>

    <!-- Uscita in corso: di norma solo la scheda di aggiunta cattura; il
         form completo resta un'eccezione esplicita, richiesta con "Modifica
         altri dati" per intervenire su meteo/luogo/altre info. -->
    <OngoingCatchForm
      v-else-if="store.current?.status === 'ongoing' && !showFullForm"
      :session="store.current"
    />

    <SessionForm
      v-else-if="store.current"
      :initial-data="store.current"
      :saving="store.loading"
      :is-edit="true"
      @submit="onSubmit"
      @cancel="onCancelFullForm"
      @delete="onDelete"
    />
  </div>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue'
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, FileText, MoreHorizontal } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'
import { useToast } from '../composables/useToast.js'
import SessionForm from '../components/form/SessionForm.vue'
import OngoingCatchForm from '../components/form/OngoingCatchForm.vue'

const { t }  = useI18n()
const store  = useSessionStore()
const router = useRouter()
const route  = useRoute()
const error  = computed(() => store.error)
const { toast } = useToast()

// Se l'uscita è in corso e si apre il form completo per modificare
// meteo/luogo/altre info, "annulla" deve tornare alla scheda catture
// invece che al riepilogo — l'uscita resta comunque in corso.
const showFullForm = ref(false)

onMounted(() => store.fetchSession(route.params.id))

function onClosed() {
  router.push(`/session/${route.params.id}`)
}

function onCancelFullForm() {
  if (store.current?.status === 'ongoing') showFullForm.value = false
  else router.push(`/session/${route.params.id}`)
}

async function onDelete() {
  if (!window.confirm(t('sessionForm.menu.deleteConfirm'))) return
  if (await store.deleteSession(route.params.id)) router.replace('/sessions')
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

  if (session.status === 'ongoing') {
    showFullForm.value = false
    toast(t('sessionForm.saved'), { type: 'success' })
  } else {
    router.push(`/session/${route.params.id}`)
  }
}
</script>

<style scoped>
.ph-label { @apply text-sm font-semibold ml-1.5; }
.ph-icon { @apply flex items-center justify-center h-11 px-3 rounded-xl text-foam bg-surface border border-border no-underline; }
.page-header  { @apply flex items-center gap-4 mb-4; }
.icon-inline  { display: inline-flex; align-items: center; gap: .35rem; }
.error-banner { @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4; }
.state-center { @apply flex items-center justify-center p-16; }
</style>
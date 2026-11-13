<template>
  <div>
    <!-- Uscita in corso: la testata con i pulsanti è dentro la scheda (mockup 34) -->
    <PageHeader v-if="!isOngoingCard" :title="t('sessionForm.menu.pageTitle')" back compact>
      <RouterLink :to="`/session/${route.params.id}`" class="fl-iconbtn" :aria-label="t('session.edit.viewSummary')" :title="t('session.edit.viewSummary')"><FileText :size="20" /></RouterLink>
    </PageHeader>

    <div v-if="store.loading && !store.current" class="state-center">
      <div class="m-spinner"></div>
    </div>

    <div v-else-if="error && !store.current" class="error-banner" style="display:inline-flex;align-items:center;gap:.4rem"><AlertTriangle :size="16" /> {{ error }}</div>

    <!-- Uscita in corso: di norma solo la scheda di aggiunta cattura; il
         form completo resta un'eccezione esplicita, richiesta con "Modifica
         altri dati" per intervenire su meteo/luogo/altre info. -->
    <OngoingCatchForm
      v-else-if="isOngoingCard"
      :session="store.current"
      @edit-full="showFullForm = true"
    />

    <SessionForm
      v-else-if="store.current"
      :initial-data="store.current"
      :saving="store.loading"
      :error="error || ''"
      :is-edit="true"
      @submit="onSubmit"
      @cancel="onCancelFullForm"
      @delete="onDelete"
    />
  </div>
</template>

<script setup>
import { confirmDialog } from '../composables/useConfirm.js'
import PageHeader from '../components/PageHeader.vue'
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, FileText } from 'lucide-vue-next'
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
const isOngoingCard = computed(() => store.current?.status === 'ongoing' && !showFullForm.value)

onMounted(() => store.fetchSession(route.params.id))

function onClosed() {
  router.push(`/session/${route.params.id}`)
}

function onCancelFullForm() {
  if (store.current?.status === 'ongoing') showFullForm.value = false
  else router.push(`/session/${route.params.id}`)
}

async function onDelete() {
  if (!(await confirmDialog(t('sessionForm.menu.deleteConfirm')))) return
  if (await store.deleteSession(route.params.id)) router.replace('/sessions')
}

async function onSubmit(payload, pendingPhotosByIndex, opts) {
  const session = await store.updateSession(route.params.id, payload)
  if (!session) return

  if (pendingPhotosByIndex?.size) {
    for (const [index, files] of pendingPhotosByIndex) {
      const catchId = session.catches?.[index]?._id
      if (catchId && files.length) await store.uploadCatchMedia(session._id, catchId, files)
    }
    await store.fetchSession(route.params.id)
  }

  // Salvataggio dentro una sezione del menu: si resta sulla pagina
  if (opts?.inPlace) {
    toast(t('sessionForm.saved'), { type: 'success' })
    return
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
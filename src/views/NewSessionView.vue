<template>
  <div>
    <div class="page-header">
      <RouterLink to="/sessions" class="btn btn-ghost btn-sm">{{ t('common.back') }}</RouterLink>
      <h2>{{ t('session.new.title') }}</h2>
    </div>

    <div v-if="error" class="error-banner" style="display:inline-flex;align-items:center;gap:.4rem"><AlertTriangle :size="16" /> {{ error }}</div>

    <div v-if="checkingOngoing" class="state-center"><div class="spinner"></div></div>

    <SessionForm v-else :saving="store.loading" @submit="onSubmit" @cancel="router.push('/sessions')" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'
import SessionForm from '../components/form/SessionForm.vue'

const { t }  = useI18n()
const store  = useSessionStore()
const router = useRouter()
const error  = computed(() => store.error)
const checkingOngoing = ref(true)

// Non si può aprire una nuova uscita se ce n'è già una in corso: si viene
// rimandati dritti lì, invece di lasciare che la creazione la chiuda.
onMounted(async () => {
  const ongoing = await store.fetchOngoing()
  if (ongoing) {
    router.replace(`/session/${ongoing._id}/edit`)
    return
  }
  checkingOngoing.value = false
})

async function onSubmit(payload, pendingPhotosByIndex) {
  const session = await store.createSession(payload)
  if (!session) {
    // Race condition (es. due schede aperte): il server ha rifiutato perché
    // nel frattempo esiste già un'uscita in corso, si viene rimandati lì.
    if (store.ongoing) router.replace(`/session/${store.ongoing._id}/edit`)
    return
  }

  if (pendingPhotosByIndex?.size) {
    for (const [index, files] of pendingPhotosByIndex) {
      const catchId = session.catches?.[index]?._id
      if (catchId && files.length) await store.uploadCatchMedia(session._id, catchId, files)
    }
  }

  // Un'uscita appena creata è "ongoing": si va sulla scheda dedicata per
  // continuare ad aggiungere pesci mentre si è ancora a pesca, invece di
  // finire sulla pagina di sola visualizzazione.
  if (session.status === 'ongoing') router.push(`/session/${session._id}/edit`)
  else router.push(`/session/${session._id}`)
}
</script>

<style scoped>
.page-header  { @apply flex items-center gap-4 mb-7; }
.error-banner { @apply bg-danger/10 border border-danger rounded-sm text-danger px-4 py-3 mb-4; }
.state-center { @apply flex items-center justify-center p-16; }
</style>

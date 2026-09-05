<template>
  <div class="ongoing-form">

    <div class="ongoing-summary">
      <div>
        <h3>{{ session.title || t('session.untitled') }}</h3>
        <p class="ongoing-meta">{{ formattedDate }}<template v-if="session.location?.name"> · {{ session.location.name }}</template></p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="$emit('edit-full')">{{ t('session.ongoing.editFull') }}</button>
    </div>

    <div v-if="error" class="error-banner"><AlertTriangle :size="16" /> {{ error }}</div>

    <CatchesSection ref="catchesRef" v-model="catches" :location="session.location" />

    <div class="ongoing-actions">
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">{{ t('common.back') }}</button>
      <button type="button" class="btn btn-primary" :disabled="closing" @click="closeSession">
        <span v-if="closing" class="spinner" style="width:15px;height:15px"></span>
        {{ closing ? t('sessionForm.saving') : t('session.ongoing.close') }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle } from 'lucide-vue-next'
import { useSessionStore } from '../../stores/sessions.js'
import { useToast } from '../../composables/useToast.js'
import CatchesSection from './CatchesSection.vue'

const { t } = useI18n()
const store = useSessionStore()
const { toast } = useToast()

const props = defineProps({
  session: { type: Object, required: true }
})
const emit = defineEmits(['cancel', 'closed', 'edit-full'])

const error     = ref(null)
const closing   = ref(false)
const catchesRef = ref(null)

// Copia locale: CatchesSection lavora su questa senza attendere il giro di
// rete, così le catture aggiunte restano visibili subito mentre il
// salvataggio (debounced) avviene in background.
const catches = ref(props.session.catches ? [...props.session.catches] : [])
let saveTimer = null

const formattedDate = computed(() => {
  if (!props.session.date) return ''
  return new Date(props.session.date).toLocaleDateString()
})

// Dopo un salvataggio riuscito le catture hanno un _id reale: è il momento
// di caricare le eventuali foto scelte nel frattempo, poi liberare le
// anteprime locali per non ricaricarle al prossimo giro.
async function uploadPendingPhotos(savedCatches) {
  const pending = catchesRef.value?.pendingPhotosByIndex
  if (!pending?.size) return
  for (const [index, files] of pending) {
    const catchId = savedCatches[index]?._id
    if (catchId && files.length) {
      await store.uploadCatchMedia(props.session._id, catchId, files)
      catchesRef.value.clearPendingPhotos(index)
    }
  }
}

async function persist(extra = {}) {
  error.value = null
  const result = await store.updateSession(props.session._id, { catches: catches.value, ...extra })
  if (!result) { error.value = store.error; return null }
  // Gli _id reali assegnati dal server servono solo per l'upload foto qui
  // sotto: non serve riportarli nella copia locale, che l'utente continua
  // a modificare nel frattempo.
  await uploadPendingPhotos(result.catches || [])
  return result
}

// Ogni cattura aggiunta/modificata va salvata subito: mentre si è ancora a
// pesca non ha senso dover "confermare" un intero form, si compila solo
// la cattura e resta salvata.
watch(catches, () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(persist, 500)
}, { deep: true })

async function closeSession() {
  clearTimeout(saveTimer)
  closing.value = true
  const result = await persist({ status: 'closed' })
  closing.value = false
  if (!result) return
  toast(t('session.ongoing.closed'), { type: 'success' })
  emit('closed', result)
}
</script>

<style scoped>
.ongoing-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 920px;
}

.ongoing-summary {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.ongoing-summary h3 {
  color: var(--foam, #cde);
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
}

.ongoing-meta {
  color: var(--text-muted, #6b8fa8);
  font-size: .85rem;
  margin-top: .2rem;
}

.error-banner {
  align-items: center;
  background: rgba(240, 80, 80, .1);
  border: 1px solid var(--danger, #f05050);
  border-radius: 6px;
  color: var(--danger, #f05050);
  display: inline-flex;
  gap: .4rem;
  padding: .75rem 1rem;
}

.ongoing-actions {
  display: flex;
  gap: .75rem;
  justify-content: flex-end;
}
</style>

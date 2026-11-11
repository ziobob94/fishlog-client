<template>
  <div class="catch-page">
    <PageHeader :title="isNew ? t('session.ongoing.newCatch') : t('session.ongoing.editCatch')" back />

    <div v-if="!ready" class="state-center"><div class="spinner"></div></div>

    <form v-else class="catch-form" @submit.prevent="save(false)">
      <div v-if="error" class="error-banner"><AlertTriangle :size="16" /> {{ error }}</div>

      <!-- 1. Specie -->
      <section>
        <h4 class="sec-title">{{ t('session.ongoing.whichFish') }}</h4>
        <div v-if="draft.species" class="chosen">
          <strong>{{ draft.species }}</strong>
          <button type="button" class="link-btn" @click="draft.species = ''">{{ t('session.ongoing.changeSpecies') }}</button>
        </div>
        <SpeciesQuickAdd v-else v-model="speciesQuery" :location="store.current?.location" @add="chooseSpecies">
          <template #actions>
            <button type="button" class="btn btn-secondary btn-sm" :disabled="speciesQuery.trim().length < 2" @click="chooseSpecies(speciesQuery.trim())">
              {{ t('session.ongoing.useName') }}
            </button>
          </template>
        </SpeciesQuickAdd>
      </section>

      <template v-if="draft.species">
        <!-- 2. Misure -->
        <section>
          <h4 class="sec-title">{{ t('session.ongoing.measures') }}</h4>
          <div class="two-cols">
            <label class="big-field">
              <span>{{ t('catchesSection.weightLabel') }}</span>
              <input v-model.number="draft.weightKg" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0" />
            </label>
            <label class="big-field">
              <span>{{ t('catchesSection.lengthLabel') }}</span>
              <input v-model.number="draft.lengthCm" type="number" inputmode="decimal" step="0.5" min="0" placeholder="0" />
            </label>
          </div>
        </section>

        <label class="released-row" :class="{ on: draft.released }">
          <span class="released-text">
            <strong>{{ t('catchesSection.releasedLabel') }}</strong>
            <small>{{ t('session.ongoing.releasedSub') }}</small>
          </span>
          <input type="checkbox" v-model="draft.released" />
        </label>

        <!-- 3. Foto -->
        <section>
          <h4 class="sec-title">{{ t('session.ongoing.photos') }}</h4>
          <div class="two-cols">
            <label class="photo-btn">
              <Camera :size="22" /> {{ t('session.ongoing.takePhoto') }}
              <input type="file" accept="image/*" capture="environment" class="sr-only" @change="pickPhotos" />
            </label>
            <label class="photo-btn">
              <Image :size="22" /> {{ t('session.ongoing.gallery') }}
              <input type="file" accept="image/*,video/*" multiple class="sr-only" @change="pickPhotos" />
            </label>
          </div>
          <p v-if="photos.length" class="photo-note">{{ t('session.ongoing.photosToAdd', { n: photos.length }) }}</p>
          <p v-else-if="draft.media?.length" class="photo-note">{{ t('session.ongoing.photosSaved', { n: draft.media.length }) }}</p>
        </section>

        <!-- 4. Altri dettagli -->
        <section>
          <button type="button" class="more-row" @click="showMore = !showMore">
            <span>
              <strong>{{ t('session.ongoing.otherDetails') }}</strong>
              <small>{{ t('session.ongoing.otherDetailsSub') }}</small>
            </span>
            <ChevronRight :size="20" :class="{ open: showMore }" />
          </button>
          <div v-if="showMore" class="more-grid">
            <label v-for="f in DETAIL_FIELDS" :key="f.key" class="field">
              <span>{{ t(`catchesSection.${f.label}`) }}</span>
              <select v-if="f.key === 'baitType'" v-model="draft.baitType">
                <option value="">--</option>
                <option value="naturale">{{ t('catchesSection.baitTypeNatural') }}</option>
                <option value="artificiale">{{ t('catchesSection.baitTypeArtificial') }}</option>
                <option value="misto">{{ t('catchesSection.baitTypeMixed') }}</option>
              </select>
              <input v-else-if="f.num" v-model.number="draft[f.key]" type="number" inputmode="decimal" step="any" min="0" />
              <input v-else v-model="draft[f.key]" :type="f.type || 'text'" :list="f.key === 'baitUsed' ? 'catch-bait-suggestions' : undefined" />
            </label>
          </div>
        </section>
      </template>

      <datalist id="catch-bait-suggestions"><option v-for="b in baitSuggestions" :key="b" :value="b" /></datalist>

      <div v-if="draft.species" class="catch-actions">
        <button type="submit" class="btn btn-primary save-btn" :disabled="saving">
          <span v-if="saving" class="spinner" style="width:15px;height:15px"></span>
          {{ t('session.ongoing.saveCatch') }}
        </button>
        <button v-if="isNew" type="button" class="link-btn" :disabled="saving" @click="save(true)">{{ t('session.ongoing.saveAndAnother') }}</button>
        <button v-else type="button" class="link-btn danger" :disabled="saving" @click="remove">{{ t('common.delete') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Camera, Image, ChevronRight } from 'lucide-vue-next'
import PageHeader from '../components/PageHeader.vue'
import SpeciesQuickAdd from '../components/form/SpeciesQuickAdd.vue'
import { useSessionStore } from '../stores/sessions.js'
import { useToast } from '../composables/useToast.js'
import { useBaitSuggestions } from '../composables/useBaitSuggestions.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useSessionStore()
const { toast } = useToast()
const { fetchBaitSuggestions } = useBaitSuggestions()

const sessionId = route.params.id
const isNew = computed(() => route.params.index === 'new')
const editIndex = computed(() => isNew.value ? null : Number(route.params.index))

// Tutti i campi che prima erano nell'elenco lungo della cattura, ora dietro «Altri dettagli».
const DETAIL_FIELDS = [
  { key: 'time', label: 'timeLabel', type: 'time' },
  { key: 'baitUsed', label: 'baitUsedLabel' },
  { key: 'baitType', label: 'baitTypeLabel' },
  { key: 'baitPresentation', label: 'baitPresentationLabel' },
  { key: 'rigUsed', label: 'rigUsedLabel' },
  { key: 'rigType', label: 'rigTypeLabel' },
  { key: 'hookSize', label: 'hookSizeLabel' },
  { key: 'hookType', label: 'hookTypeLabel' },
  { key: 'sinkerWeight', label: 'sinkerWeightLabel', num: true },
  { key: 'sinkerType', label: 'sinkerTypeLabel' },
  { key: 'lineMainLb', label: 'lineMainLabel', num: true },
  { key: 'leaderLb', label: 'leaderLabel', num: true },
  { key: 'swivel', label: 'swivelLabel' },
  { key: 'distance', label: 'distanceLabel', num: true },
  { key: 'direction', label: 'directionLabel' },
  { key: 'notes', label: 'notesLabel' }
]

const emptyDraft = () => ({ species: '', weightKg: null, lengthCm: null, released: false })

const ready = ref(false)
const error = ref(null)
const saving = ref(false)
const draft = ref(emptyDraft())
const speciesQuery = ref('')
const photos = ref([])
const showMore = ref(false)
const baitSuggestions = ref([])

onMounted(async () => {
  if (store.current?._id !== sessionId) await store.fetchSession(sessionId)
  const session = store.current
  if (!session) { router.replace('/sessions'); return }
  if (!isNew.value) {
    const c = session.catches?.[editIndex.value]
    if (!c) { router.replace(`/session/${sessionId}/edit`); return }
    draft.value = { ...emptyDraft(), ...c }
    showMore.value = DETAIL_FIELDS.some(f => draft.value[f.key])
  }
  ready.value = true
  try { baitSuggestions.value = await fetchBaitSuggestions() } catch { /* opzionale */ }
})

function chooseSpecies(name) {
  if (!name) return
  draft.value.species = name
  speciesQuery.value = ''
}

function pickPhotos(event) {
  const files = [...event.target.files]
  event.target.value = ''
  photos.value = [...photos.value, ...files]
}

function cleanDraft() {
  const out = { ...draft.value, species: draft.value.species.trim() }
  for (const k of Object.keys(out)) if (out[k] === '' || out[k] === null || Number.isNaN(out[k])) delete out[k]
  if (draft.value.baitType === '') out.baitType = ''
  return out
}

async function persist(list) {
  error.value = null
  const result = await store.updateSession(sessionId, { catches: list })
  if (!result) error.value = store.error
  return result
}

// Salvataggio esplicito: "Salva cattura" torna alla scheda, "Salva e aggiungine un'altra" riparte da zero.
async function save(another) {
  if (!draft.value.species?.trim()) return
  saving.value = true
  const current = store.current?.catches || []
  const entry = cleanDraft()
  const index = isNew.value ? current.length : editIndex.value
  const list = isNew.value ? [...current, entry] : current.map((c, i) => i === index ? { ...c, ...entry } : c)

  const result = await persist(list)
  if (!result) { saving.value = false; return }

  const saved = result.catches?.[index]
  if (photos.value.length) {
    if (saved?._id) {
      await store.uploadCatchMedia(sessionId, saved._id, photos.value)
      await store.fetchSession(sessionId)
    } else {
      toast(t('session.ongoing.photosOffline'), { type: 'warning' })
    }
  }
  saving.value = false
  toast(t('session.ongoing.fishSaved'), { type: 'success' })

  if (another) {
    draft.value = emptyDraft(); photos.value = []; showMore.value = false
    window.scrollTo({ top: 0 })
    if (!isNew.value) router.replace(`/session/${sessionId}/catch/new`)
  } else {
    router.replace(`/session/${sessionId}/edit`)
  }
}

async function remove() {
  saving.value = true
  const list = (store.current?.catches || []).filter((_, i) => i !== editIndex.value)
  const result = await persist(list)
  saving.value = false
  if (result) router.replace(`/session/${sessionId}/edit`)
}
</script>

<style scoped>
.catch-form { display: flex; flex-direction: column; gap: 1.25rem; max-width: 640px; padding-bottom: 7rem; }
.state-center { display: flex; justify-content: center; padding: 4rem; }
.sec-title { color: var(--text-muted, #6b8fa8); font-size: .75rem; font-weight: 800; letter-spacing: .06em; margin-bottom: .5rem; text-transform: uppercase; }
.error-banner { align-items: center; background: rgba(240,80,80,.1); border: 1px solid var(--danger, #f05050); border-radius: 6px; color: var(--danger, #f05050); display: inline-flex; gap: .4rem; padding: .75rem 1rem; }
.chosen { align-items: center; background: var(--surface, #0a1929); border: 1px solid var(--ocean, #0ea5e9); border-radius: 12px; color: var(--foam, #cde); display: flex; font-size: 1.15rem; justify-content: space-between; padding: .75rem 1rem; }
.link-btn { background: none; border: none; color: var(--ocean, #0ea5e9); cursor: pointer; font-size: .9rem; font-weight: 600; padding: .6rem; }
.link-btn.danger { color: var(--danger, #f05050); }
.two-cols { display: grid; gap: .75rem; grid-template-columns: 1fr 1fr; }
.big-field { background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55); border-radius: 12px; display: flex; flex-direction: column; gap: .2rem; padding: .6rem .9rem; }
.big-field span { color: var(--text-muted, #6b8fa8); font-size: .78rem; }
.big-field input { background: none; border: none; color: var(--foam, #cde); font-family: monospace; font-size: 2rem; min-height: 48px; outline: none; padding: 0; width: 100%; }
.released-row { align-items: center; background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55); border-radius: 12px; cursor: pointer; display: flex; justify-content: space-between; padding: .9rem 1rem; }
.released-row.on { border-color: var(--success, #5cd98a); }
.released-text { display: flex; flex-direction: column; gap: .1rem; }
.released-text small { color: var(--text-muted, #6b8fa8); }
.released-row input { height: 26px; width: 26px; }
.photo-btn { align-items: center; background: var(--surface, #0a1929); border: 1px dashed var(--ocean, #0ea5e9); border-radius: 12px; color: var(--ocean, #0ea5e9); cursor: pointer; display: flex; flex-direction: column; font-weight: 700; gap: .4rem; justify-content: center; min-height: 84px; }
.photo-note { color: var(--success, #5cd98a); font-size: .85rem; margin-top: .5rem; }
.more-row { align-items: center; background: none; border: none; border-top: 1px solid var(--border, #2a3f55); color: var(--foam, #cde); cursor: pointer; display: flex; justify-content: space-between; padding: 1rem 0; text-align: left; width: 100%; }
.more-row span { display: flex; flex-direction: column; gap: .15rem; }
.more-row small { color: var(--text-muted, #6b8fa8); }
.more-row svg.open { transform: rotate(90deg); }
.more-grid { display: grid; gap: .75rem; grid-template-columns: 1fr 1fr; }
.field { display: flex; flex-direction: column; gap: .3rem; }
.field span { color: var(--text-muted, #6b8fa8); font-size: .78rem; font-weight: 700; }
.field input, .field select { min-height: 44px; }
.catch-actions { background: var(--ink); border-top: 1px solid var(--border, #2a3f55); bottom: 0; display: flex; flex-direction: column; gap: .25rem; left: 0; padding: .9rem 1rem calc(.9rem + env(safe-area-inset-bottom)); position: fixed; right: 0; z-index: 50; }
.save-btn { min-height: 52px; width: 100%; }
</style>

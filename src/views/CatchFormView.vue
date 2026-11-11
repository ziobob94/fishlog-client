<template>
  <div class="catch-page">
    <PageHeader :title="isNew ? t('session.ongoing.newCatch') : t('session.ongoing.editCatch')" back compact />

    <div v-if="!ready" class="state-center"><div class="spinner"></div></div>

    <form v-else class="catch-form" novalidate @submit.prevent="save(false)">
      <div v-if="error" class="error-banner"><AlertTriangle :size="16" /> {{ error }}</div>

      <!-- Che pesce è? -->
      <section>
        <label class="fl-lab" for="species-quickadd-input">{{ t('session.ongoing.whichFish') }}</label>
        <SpeciesQuickAdd v-model="speciesQuery" :location="store.current?.location" :selected="draft.species" :show-label="false" @add="chooseSpecies">
          <template #actions>
            <button type="button" class="fl-chip use-name" :disabled="speciesQuery.trim().length < 2" @click="chooseSpecies(speciesQuery.trim())">
              {{ t('session.ongoing.useName') }}
            </button>
          </template>
        </SpeciesQuickAdd>
      </section>

      <template v-if="draft.species">
        <!-- Misure -->
        <section>
          <span class="fl-lab">{{ t('session.ongoing.measures') }}</span>
          <div class="two-cols">
            <label class="measure">
              <span class="m-lab">{{ t('session.ongoing.weight') }}</span>
              <span class="m-row"><input v-model.number="draft.weightKg" class="fl-mono m-inp" inputmode="decimal" type="number" step="0.01" min="0" :aria-label="t('session.ongoing.weightAria')" placeholder="0" /><span class="m-unit">kg</span></span>
            </label>
            <label class="measure">
              <span class="m-lab">{{ t('session.ongoing.length') }}</span>
              <span class="m-row"><input v-model.number="draft.lengthCm" class="fl-mono m-inp" inputmode="decimal" type="number" step="0.5" min="0" :aria-label="t('session.ongoing.lengthAria')" placeholder="0" /><span class="m-unit">cm</span></span>
            </label>
          </div>
        </section>

        <!-- Rilasciato -->
        <section class="released">
          <span class="rel-icon"><RefreshCw :size="22" /></span>
          <span class="rel-text"><strong>{{ t('session.ongoing.releasedShort') }}</strong><small>{{ t('session.ongoing.releasedSub') }}</small></span>
          <button type="button" class="fl-switch" :class="{ on: draft.released }" role="switch" :aria-checked="!!draft.released" :aria-label="t('session.ongoing.releasedShort')" @click="draft.released = !draft.released"></button>
        </section>

        <!-- Foto -->
        <section>
          <span class="fl-lab">{{ t('session.ongoing.photos') }}</span>
          <div class="two-cols">
            <label class="photo-btn primary">
              <Camera :size="24" /> {{ t('session.ongoing.takePhoto') }}
              <input type="file" accept="image/*" capture="environment" class="sr-only" @change="pickPhotos" />
            </label>
            <label class="photo-btn">
              <Image :size="24" /> {{ t('session.ongoing.gallery') }}
              <input type="file" accept="image/*,video/*" multiple class="sr-only" @change="pickPhotos" />
            </label>
          </div>
          <p v-if="photos.length" class="photo-note">{{ t('session.ongoing.photosToAdd', { n: photos.length }) }}</p>
          <p v-else-if="draft.media?.length" class="photo-note">{{ t('session.ongoing.photosSaved', { n: draft.media.length }) }}</p>
        </section>

        <!-- Altri dettagli -->
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
              <span class="fl-lab">{{ t(`catchesSection.${f.label}`) }}</span>
              <select v-if="f.key === 'baitType'" v-model="draft.baitType" class="fl-inp">
                <option value="">--</option>
                <option value="naturale">{{ t('catchesSection.baitTypeNatural') }}</option>
                <option value="artificiale">{{ t('catchesSection.baitTypeArtificial') }}</option>
                <option value="misto">{{ t('catchesSection.baitTypeMixed') }}</option>
              </select>
              <input v-else-if="f.num" v-model.number="draft[f.key]" class="fl-inp" type="number" inputmode="decimal" step="any" min="0" />
              <input v-else v-model="draft[f.key]" class="fl-inp" :type="f.type || 'text'" :list="f.key === 'baitUsed' ? 'catch-bait-suggestions' : undefined" v-ph="'--:--'" />
            </label>
          </div>
        </section>
      </template>

      <datalist id="catch-bait-suggestions"><option v-for="b in baitSuggestions" :key="b" :value="b" /></datalist>

      <div v-if="draft.species" class="fl-bar">
        <button type="submit" class="fl-btn1" :disabled="saving">
          <span v-if="saving" class="spinner" style="width:15px;height:15px"></span>
          {{ t('session.ongoing.saveCatch') }}
        </button>
        <button v-if="isNew" type="button" class="bar-link" :disabled="saving" @click="save(true)">{{ t('session.ongoing.saveAndAnother') }}</button>
        <button v-else type="button" class="bar-link danger" :disabled="saving" @click="remove">{{ t('common.delete') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Camera, Image, ChevronRight, RefreshCw } from 'lucide-vue-next'
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
.catch-form { display: flex; flex-direction: column; gap: 26px; max-width: 640px; padding: 0 0 calc(130px + env(safe-area-inset-bottom)); }
.state-center { display: flex; justify-content: center; padding: 4rem; }
.error-banner { align-items: center; background: rgba(240,80,80,.1); border: 1px solid var(--danger); border-radius: 6px; color: var(--danger); display: inline-flex; gap: .4rem; padding: .75rem 1rem; }
.use-name { min-height: 52px; border-radius: 14px; white-space: nowrap; }
.use-name:disabled { opacity: .5; }

.two-cols { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.measure { display: flex; flex-direction: column; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 12px 14px; margin: 0; text-transform: none; letter-spacing: 0; }
.m-lab { font-size: 13px; color: var(--text-muted); font-weight: 600; }
.m-row { display: flex; align-items: baseline; gap: 6px; }
.m-inp, .m-inp:focus { width: 100%; min-width: 0; min-height: 0; background: transparent; border: 0; border-radius: 0; box-shadow: none; outline: none; color: var(--foam); font-size: 34px; letter-spacing: -.04em; padding: 0; }
.m-unit { font-size: 14px; color: var(--text-muted); }

.released { display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 12px 14px; min-height: 64px; box-sizing: border-box; }
.rel-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(74, 222, 128, .14); color: rgb(var(--color-success-text)); display: flex; align-items: center; justify-content: center; flex: none; }
.rel-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.rel-text strong { font-size: 15px; font-weight: 800; color: var(--foam); }
.rel-text small { font-size: 13px; color: var(--text-muted); }

.photo-btn { min-height: 84px; border-radius: 18px; border: 1px dashed var(--border-light); background: var(--surface); color: var(--foam); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-weight: 700; font-size: 14px; cursor: pointer; margin: 0; text-transform: none; letter-spacing: 0; }
.photo-btn.primary { border-color: rgb(var(--color-ocean-text)); background: rgba(14, 165, 233, .08); color: rgb(var(--color-ocean-text)); }
.photo-note { color: var(--success); font-size: .85rem; margin-top: .5rem; }

.more-row { align-items: center; background: none; border: none; border-top: 1px solid var(--border); color: var(--foam); cursor: pointer; display: flex; justify-content: space-between; padding: 16px 0 6px; text-align: left; width: 100%; }
.more-row span { display: flex; flex-direction: column; gap: 2px; }
.more-row strong { font-size: 16px; font-weight: 800; }
.more-row small { color: var(--text-muted); font-size: 13px; }
.more-row svg { color: rgb(var(--color-ocean-text)); }
.more-row svg.open { transform: rotate(90deg); }
.more-grid { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; margin-top: 12px; }
.field { display: flex; flex-direction: column; margin: 0; }

.bar-link { background: none; border: none; color: rgb(var(--color-ocean-text)); cursor: pointer; font-weight: 700; font-size: 15px; min-height: 36px; }
.bar-link.danger { color: rgb(var(--color-danger-text)); }
</style>

<template>
  <div class="catch-page">
    <PageHeader :title="isNew ? t('session.ongoing.newCatch') : t('session.ongoing.editCatch')" back compact>
      <button v-if="!isNew && ready" type="button" class="ph-trash" :aria-label="t('catchPage.deleteAria')" :disabled="saving" @click="remove"><Trash2 :size="20" /></button>
    </PageHeader>

    <div v-if="!ready" class="state-center"><div class="m-spinner"></div></div>

    <form v-else class="catch-form" novalidate @submit.prevent="save(false)">
      <div v-if="!online" class="info-banner" role="status"><WifiOff :size="16" /> {{ t('catchPage.offline') }}</div>
      <div v-if="error" class="error-banner" role="alert">
        <span class="eb-text"><AlertTriangle :size="16" /> {{ t('catchPage.saveError') }}</span>
        <button type="button" class="eb-retry" :disabled="saving || !online" @click="save(false)">{{ t('catchPage.retry') }}</button>
      </div>

      <!-- Banner dell'uscita -->
      <div v-if="session" class="session-banner">
        <span class="sb-lab">{{ isNew ? t('catchPage.sessionBanner') : t('session.view.sections.catches', { n: session.catches?.length || 0 }) }}</span>
        <strong class="sb-title">{{ session.title || session.location?.name || t('session.untitled') }}</strong>
        <span class="fl-mono sb-meta">{{ bannerMeta }}</span>
      </div>

      <!-- Che pesce è? -->
      <section>
        <label class="fl-lab" for="species-quickadd-input">{{ t('session.ongoing.whichFish') }} <span class="req" aria-hidden="true">*</span></label>
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
          <button type="button" class="more-row" :aria-expanded="showMore" aria-controls="more-details" @click="showMore = !showMore">
            <span>
              <strong>{{ t('session.ongoing.otherDetails') }}</strong>
              <small>{{ t('session.ongoing.otherDetailsSub') }}</small>
            </span>
            <ChevronRight :size="20" :class="{ open: showMore }" />
          </button>
          <div v-if="showMore" id="more-details" class="more-grid">
            <label v-for="f in DETAIL_FIELDS" :key="f.key" class="field">
              <span class="fl-lab">{{ f.raw ? t(f.raw) : t(`catchesSection.${f.label}`) }}</span>
              <select v-if="f.key === 'baitType'" v-model="draft.baitType" class="fl-inp">
                <option value="">--</option>
                <option value="naturale">{{ t('catchesSection.baitTypeNatural') }}</option>
                <option value="artificiale">{{ t('catchesSection.baitTypeArtificial') }}</option>
                <option value="misto">{{ t('catchesSection.baitTypeMixed') }}</option>
              </select>
              <input v-else-if="f.key === 'time'" id="catch-time" v-model="draft.time" class="fl-inp fl-mono" type="time" :aria-invalid="blocked" aria-describedby="catch-time-err" v-ph="'--:--'" />
              <input v-else-if="f.num" v-model.number="draft[f.key]" class="fl-inp" type="number" inputmode="decimal" step="any" min="0" />
              <input v-else v-model="draft[f.key]" class="fl-inp" :type="f.type || 'text'" :list="f.key === 'baitUsed' ? 'catch-bait-suggestions' : undefined" v-ph="'--:--'" />
            </label>
          </div>
        </section>

        <!-- Ora fuori dalla fascia dell'uscita -->
        <section v-if="windowCheck.ok === false || extension" id="catch-time-err" class="time-err" :class="{ resolved: !blocked }" role="alert">
          <template v-if="blocked">
            <p class="te-msg"><AlertTriangle :size="16" /> {{ windowMessage }}</p>
            <div class="te-actions">
              <button type="button" class="fl-btn2 te-btn" @click="extendSession">{{ windowCheck.side === 'before' ? t('catchPage.extendStart', { time: windowCheck.time }) : t('catchPage.extendEnd', { time: windowCheck.time }) }}</button>
              <button type="button" class="fl-btn2 te-btn" @click="pickOtherTime">{{ t('catchPage.pickOther') }}</button>
            </div>
          </template>
          <p v-else class="te-msg ok">
            <Check :size="16" /> {{ extension.side === 'before' ? t('catchPage.willExtendStart', { time: extension.time }) : t('catchPage.willExtendEnd', { time: extension.time }) }}
            <button type="button" class="te-undo" @click="extension = null">{{ t('catchPage.undoExtend') }}</button>
          </p>
        </section>
      </template>

      <datalist id="catch-bait-suggestions"><option v-for="b in baitSuggestions" :key="b" :value="b" /></datalist>

      <div v-if="draft.species" class="fl-bar">
        <button type="submit" class="fl-btn1" :disabled="saving || blocked || !online">
          <span v-if="saving" class="m-spinner" style="width:15px;height:15px"></span>
          {{ isNew ? t('session.ongoing.saveCatch') : t('catchPage.saveChanges') }}
        </button>
        <button v-if="isNew && session?.status === 'ongoing'" type="button" class="bar-link" :disabled="saving || blocked || !online" @click="save(true)">{{ t('session.ongoing.saveAndAnother') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Camera, Image, ChevronRight, RefreshCw, Trash2, WifiOff, Check } from 'lucide-vue-next'
import PageHeader from '../components/PageHeader.vue'
import SpeciesQuickAdd from '../components/form/SpeciesQuickAdd.vue'
import { useSessionStore } from '../stores/sessions.js'
import { useToast } from '../composables/useToast.js'
import { useBaitSuggestions } from '../composables/useBaitSuggestions.js'
import { useOnline } from '../composables/useOnline.js'
import { useUnsavedGuard } from '../composables/useUnsavedGuard.js'
import { confirmDialog } from '../composables/useConfirm.js'
import { setLastCatchChange } from '../composables/useUndoCatch.js'
import { checkCatchTime } from '../utils/catchWindow.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useSessionStore()
const { toast } = useToast()
const { fetchBaitSuggestions } = useBaitSuggestions()
const online = useOnline()

const sessionId = route.params.id
const isNew = computed(() => route.params.index === 'new')
const editIndex = computed(() => isNew.value ? null : Number(route.params.index))

// Tutti i campi che prima erano nell'elenco lungo della cattura, ora dietro «Altri dettagli».
const DETAIL_FIELDS = [
  { key: 'time', label: 'timeLabel', type: 'time' },
  { key: 'fightMinutes', raw: 'session.ongoing.fight', num: true },
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

const emptyDraft = () => ({ species: '', weightKg: null, lengthCm: null, fightMinutes: null, released: false })

const ready = ref(false)
const error = ref(null)
const saving = ref(false)
const draft = ref(emptyDraft())
const speciesQuery = ref('')
const photos = ref([])
const showMore = ref(false)
const baitSuggestions = ref([])
const extension = ref(null) // { side: 'after' | 'before', time } — estensione dell'uscita applicata al salvataggio
const snapshot = ref('')

const session = computed(() => store.current)
const bannerMeta = computed(() => {
  const s = session.value
  if (!s) return ''
  const d = s.date ? new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const range = s.startTime ? `${s.startTime}${s.endTime ? '–' + s.endTime : ''}` : ''
  return [d, range].filter(Boolean).join(' · ')
})

// Ora della cattura fuori dalla fascia dell'uscita conclusa: Salva resta disabilitato finché non si risolve.
const windowCheck = computed(() => checkCatchTime(session.value, draft.value.time))
const extended = computed(() => !!extension.value && extension.value.time === draft.value.time && extension.value.side === windowCheck.value.side)
const blocked = computed(() => windowCheck.value.ok === false && !extended.value)
const windowMessage = computed(() => windowCheck.value.side === 'before'
  ? t('catchPage.outsideBefore', { time: windowCheck.value.time, start: session.value?.startTime })
  : t('catchPage.outsideAfter', { time: windowCheck.value.time, end: session.value?.endTime }))

function extendSession() { extension.value = { side: windowCheck.value.side, time: windowCheck.value.time } }
async function pickOtherTime() {
  extension.value = null
  showMore.value = true
  await nextTick()
  const el = document.getElementById('catch-time')
  el?.focus(); el?.scrollIntoView?.({ block: 'center' })
}

const dirtyState = () => JSON.stringify([draft.value, photos.value.length, extension.value])
const guard = useUnsavedGuard(() => ready.value && !saving.value && dirtyState() !== snapshot.value)

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
  snapshot.value = dirtyState()
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

async function persist(payload) {
  error.value = null
  const result = await store.updateSession(sessionId, payload)
  if (!result) error.value = store.error || 'error'
  return result
}

const snapshotOf = s => ({ catches: JSON.parse(JSON.stringify(s?.catches || [])), startTime: s?.startTime, endTime: s?.endTime })

// Dopo il salvataggio su un'uscita conclusa si torna al dettaglio: cattura evidenziata e «Annulla».
function leaveAfterSave(kind, catchId, previous) {
  guard.allowLeave()
  if (session.value?.status === 'ongoing') { router.replace(`/session/${sessionId}/edit`); return }
  setLastCatchChange({ sessionId, catchId, previous, kind })
  router.replace(`/session/${sessionId}`)
}

// Salvataggio esplicito: «Salva cattura» torna alla scheda, «Salva e aggiungine un'altra» riparte da zero.
async function save(another) {
  if (!draft.value.species?.trim() || blocked.value || !online.value || saving.value) return
  saving.value = true
  const previous = snapshotOf(store.current)
  const current = store.current?.catches || []
  const entry = cleanDraft()
  const index = isNew.value ? current.length : editIndex.value
  const list = isNew.value ? [...current, entry] : current.map((c, i) => i === index ? { ...c, ...entry } : c)
  const payload = { catches: list }
  if (extension.value && extended.value) payload[extension.value.side === 'before' ? 'startTime' : 'endTime'] = extension.value.time

  const result = await persist(payload)
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

  if (another) {
    toast(t('session.ongoing.fishSaved'), { type: 'success' })
    draft.value = emptyDraft(); photos.value = []; showMore.value = false; extension.value = null
    snapshot.value = dirtyState()
    window.scrollTo({ top: 0 })
    if (!isNew.value) router.replace(`/session/${sessionId}/catch/new`)
  } else {
    leaveAfterSave(isNew.value ? 'added' : 'updated', saved?._id, previous)
  }
}

async function remove() {
  if (!online.value) return
  if (!(await confirmDialog(t('catchPage.deleteConfirm'), { title: t('catchPage.deleteTitle'), confirmLabel: t('common.delete') }))) return
  saving.value = true
  const previous = snapshotOf(store.current)
  const list = (store.current?.catches || []).filter((_, i) => i !== editIndex.value)
  const result = await persist({ catches: list })
  saving.value = false
  if (result) leaveAfterSave('removed', null, previous)
}
</script>

<style scoped>
.catch-form { display: flex; flex-direction: column; gap: 26px; max-width: 640px; padding: 0 0 calc(130px + env(safe-area-inset-bottom)); }
.state-center { display: flex; justify-content: center; padding: 4rem; }
.error-banner { align-items: center; background: rgba(240,80,80,.1); border: 1px solid var(--danger); border-radius: 14px; color: rgb(var(--color-danger-text)); display: flex; justify-content: space-between; flex-wrap: wrap; gap: .5rem; padding: .75rem 1rem; }
.eb-text { display: inline-flex; align-items: center; gap: .4rem; font-weight: 600; }
.eb-retry { background: none; border: 1px solid currentColor; border-radius: 10px; color: inherit; cursor: pointer; font-weight: 700; min-height: 44px; padding: 0 14px; }
.eb-retry:disabled { opacity: .5; cursor: default; }
.info-banner { display: flex; align-items: center; gap: .5rem; background: var(--surface-2); border: 1px solid var(--border-light); border-radius: 14px; color: var(--foam); padding: .75rem 1rem; font-size: 14px; }
.session-banner { display: flex; flex-direction: column; gap: 2px; background: rgb(var(--color-sea-deep)); border: 1px solid var(--border); border-radius: 18px 18px 18px 6px; padding: 12px 16px; }
.sb-lab { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.sb-title { font-family: var(--font-display); color: var(--foam); font-size: 18px; font-weight: 800; }
.sb-meta { color: rgb(var(--color-ocean-text)); font-size: 12px; }
.ph-trash { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: 0; color: rgb(var(--color-danger-text)); cursor: pointer; border-radius: 12px; }
.ph-trash:focus-visible, .te-undo:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.time-err { border: 1px solid var(--danger); background: rgba(240,80,80,.08); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.time-err.resolved { border-color: var(--border-light); background: var(--surface); }
.te-msg { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; margin: 0; color: rgb(var(--color-danger-text)); font-weight: 600; font-size: 14px; }
.te-msg.ok { color: var(--foam); }
.te-actions { display: flex; flex-direction: column; gap: 8px; }
.te-btn { min-height: 48px; }
.te-undo { background: none; border: 0; color: rgb(var(--color-ocean-text)); cursor: pointer; font-weight: 700; min-height: 44px; padding: 0 6px; margin-left: auto; }
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
</style>

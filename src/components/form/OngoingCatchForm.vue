<template>
  <div class="ongoing">

    <!-- Intestazione minima: dove sono e come tornare ai dati dell'uscita -->
    <div class="ongoing-head">
      <div>
        <p class="ongoing-badge">{{ t('session.ongoing.badge') }}</p>
        <h3>{{ session.title || t('session.untitled') }}</h3>
        <p class="ongoing-meta">{{ formattedDate }}<template v-if="session.location?.name"> · {{ session.location.name }}</template></p>
      </div>
      <button type="button" class="link-btn" @click="$emit('edit-full')">{{ t('session.ongoing.editFull') }}</button>
    </div>

    <div v-if="error" class="error-banner"><AlertTriangle :size="16" /> {{ error }}</div>

    <!-- Unica azione per aggiungere -->
    <button type="button" class="btn btn-primary add-btn" @click="openNew">
      <Plus :size="22" /> {{ t('session.ongoing.addFish') }}
    </button>

    <!-- Lista pesci -->
    <section class="fish-list">
      <h4>{{ t('session.ongoing.listTitle', { n: catches.length }) }}</h4>
      <p v-if="!catches.length" class="empty">{{ t('session.ongoing.emptyList') }}</p>
      <ul v-else>
        <li v-for="(c, i) in catches" :key="c._id || i">
          <button type="button" class="fish-card" @click="openEdit(i)">
            <span class="fish-main">
              <strong>{{ c.species }}</strong>
              <span class="fish-sub">{{ summary(c) }}</span>
            </span>
            <span class="fish-tags">
              <span v-if="c.released" class="tag">↺ {{ t('session.ongoing.released') }}</span>
              <span v-if="c.media?.length" class="tag"><Camera :size="12" /> {{ c.media.length }}</span>
              <ChevronRight :size="18" class="fish-go" />
            </span>
          </button>
        </li>
      </ul>
    </section>

    <!-- Una sola azione per finire -->
    <div class="finish">
      <button type="button" class="btn btn-secondary finish-btn" :disabled="closing" @click="confirmClose = true">
        <span v-if="closing" class="spinner" style="width:15px;height:15px"></span>
        {{ closing ? t('sessionForm.saving') : t('session.ongoing.close') }}
      </button>
      <p>{{ t('session.ongoing.closeHint') }}</p>
    </div>

    <!-- Passo "pesce": nuova cattura o modifica -->
    <Teleport to="body">
      <div v-if="sheet" class="sheet-overlay" @click.self="closeSheet">
        <form class="sheet" @submit.prevent="saveFish">
          <div class="sheet-head">
            <h3>{{ editIndex === null ? t('session.ongoing.newFish') : t('session.ongoing.editFish') }}</h3>
            <button type="button" class="icon-btn" :aria-label="t('common.cancel')" @click="closeSheet"><X :size="20" /></button>
          </div>

          <!-- Passo 1: la specie -->
          <div v-if="!draft.species" class="sheet-body">
            <SpeciesQuickAdd v-model="speciesQuery" :location="session.location" @add="chooseSpecies">
              <template #actions>
                <button type="button" class="btn btn-secondary btn-sm" :disabled="speciesQuery.trim().length < 2" @click="chooseSpecies(speciesQuery.trim())">
                  {{ t('session.ongoing.useName') }}
                </button>
              </template>
            </SpeciesQuickAdd>
          </div>

          <!-- Passo 2: i dettagli, tutti facoltativi -->
          <div v-else class="sheet-body">
            <div class="chosen">
              <strong>{{ draft.species }}</strong>
              <button type="button" class="link-btn" @click="draft.species = ''">{{ t('session.ongoing.changeSpecies') }}</button>
            </div>

            <div class="two-cols">
              <label class="field">
                <span>{{ t('catchesSection.weightLabel') }}</span>
                <input v-model.number="draft.weightKg" type="number" inputmode="decimal" step="0.01" min="0" :placeholder="t('session.ongoing.optional')" />
              </label>
              <label class="field">
                <span>{{ t('catchesSection.lengthLabel') }}</span>
                <input v-model.number="draft.lengthCm" type="number" inputmode="decimal" step="0.5" min="0" :placeholder="t('session.ongoing.optional')" />
              </label>
            </div>

            <label class="switch-line">
              <input type="checkbox" v-model="draft.released" />
              <span>{{ t('catchesSection.releasedLabel') }}</span>
            </label>

            <div class="photo-line">
              <label class="btn btn-ghost btn-sm">
                <Camera :size="18" /> {{ t('catchesSection.takePhoto') }}
                <input type="file" accept="image/*" capture="environment" class="sr-only" @change="pickPhotos" />
              </label>
              <label class="btn btn-ghost btn-sm">
                <Upload :size="18" /> {{ t('catchesSection.uploadPhoto') }}
                <input type="file" accept="image/*,video/*" multiple class="sr-only" @change="pickPhotos" />
              </label>
              <span v-if="draftPhotos.length" class="photo-count">{{ t('session.ongoing.photosToAdd', { n: draftPhotos.length }) }}</span>
              <span v-else-if="draft.media?.length" class="photo-count">{{ t('session.ongoing.photosSaved', { n: draft.media.length }) }}</span>
            </div>

            <button type="button" class="link-btn more-btn" @click="showMore = !showMore">
              {{ showMore ? t('session.ongoing.lessDetails') : t('session.ongoing.moreDetails') }}
            </button>
            <div v-if="showMore" class="more">
              <label class="field">
                <span>{{ t('catchesSection.baitUsedLabel') }}</span>
                <input v-model="draft.baitUsed" type="text" list="ongoing-bait-suggestions" :placeholder="t('catchesSection.baitUsedPlaceholder')" />
              </label>
              <label class="field">
                <span>{{ t('catchesSection.timeLabel') }}</span>
                <input v-model="draft.time" type="time" />
              </label>
              <label class="field">
                <span>{{ t('catchesSection.notesLabel') }}</span>
                <input v-model="draft.notes" type="text" :placeholder="t('catchesSection.notesPlaceholder')" />
              </label>
              <p class="more-hint">{{ t('session.ongoing.rigHint') }}</p>
            </div>
          </div>

          <div v-if="draft.species" class="sheet-actions">
            <button v-if="editIndex !== null" type="button" class="btn btn-danger btn-sm" @click="removeFish">
              <Trash2 :size="16" /> {{ t('common.delete') }}
            </button>
            <button type="submit" class="btn btn-primary save-btn" :disabled="saving">
              <span v-if="saving" class="spinner" style="width:15px;height:15px"></span>
              {{ editIndex === null ? t('session.ongoing.saveFish') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="confirmClose" class="sheet-overlay center" @click.self="confirmClose = false">
        <div class="card dialog">
          <h3>{{ t('session.ongoing.closeDialogTitle') }}</h3>
          <p class="text-muted mt-1">{{ t('session.ongoing.closeDialogText', { n: catches.length }, catches.length) }}</p>
          <div class="dialog-actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="confirmClose = false">{{ t('session.ongoing.keepFishing') }}</button>
            <button type="button" class="btn btn-primary btn-sm" @click="confirmClose = false; closeSession()">{{ t('session.ongoing.close') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <datalist id="ongoing-bait-suggestions">
      <option v-for="b in baitSuggestions" :key="b" :value="b" />
    </datalist>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Plus, ChevronRight, Camera, Upload, Trash2, X } from 'lucide-vue-next'
import { useSessionStore } from '../../stores/sessions.js'
import { useToast } from '../../composables/useToast.js'
import { useBaitSuggestions } from '../../composables/useBaitSuggestions.js'
import SpeciesQuickAdd from './SpeciesQuickAdd.vue'

const { t } = useI18n()
const store = useSessionStore()
const { toast } = useToast()
const { fetchBaitSuggestions } = useBaitSuggestions()

const props = defineProps({
  session: { type: Object, required: true }
})
const emit = defineEmits(['cancel', 'closed', 'edit-full'])

const error        = ref(null)
const closing      = ref(false)
const saving       = ref(false)
const confirmClose = ref(false)

// Copia locale delle catture: la lista si aggiorna subito, il salvataggio
// sul server avviene a ogni "Salva pesce" (nessun form globale da confermare).
const catches = ref(props.session.catches ? props.session.catches.map(c => ({ ...c })) : [])

const baitSuggestions = ref([])
onMounted(async () => {
  try { baitSuggestions.value = await fetchBaitSuggestions() } catch { /* suggerimenti opzionali */ }
})

const formattedDate = computed(() => {
  if (!props.session.date) return ''
  return new Date(props.session.date).toLocaleDateString()
})

function summary(c) {
  const parts = []
  if (c.weightKg) parts.push(`${c.weightKg} kg`)
  if (c.lengthCm) parts.push(`${c.lengthCm} cm`)
  return parts.length ? parts.join(' · ') : t('session.ongoing.noDetails')
}

// ─── Passo "pesce" ───────────────────────────────────────────────────────────

const emptyDraft = () => ({ species: '', weightKg: null, lengthCm: null, released: false, baitUsed: '', time: '', notes: '' })

const sheet        = ref(false)
const editIndex    = ref(null)
const draft        = ref(emptyDraft())
const speciesQuery = ref('')
const showMore     = ref(false)
const draftPhotos  = ref([])

function openNew() {
  editIndex.value = null
  draft.value = emptyDraft()
  speciesQuery.value = ''
  draftPhotos.value = []
  showMore.value = false
  sheet.value = true
}

function openEdit(i) {
  editIndex.value = i
  draft.value = { ...emptyDraft(), ...catches.value[i] }
  speciesQuery.value = ''
  draftPhotos.value = []
  showMore.value = !!(draft.value.baitUsed || draft.value.time || draft.value.notes)
  sheet.value = true
}

function closeSheet() {
  sheet.value = false
}

function chooseSpecies(name) {
  if (!name) return
  draft.value.species = name
  speciesQuery.value = ''
}

function pickPhotos(event) {
  const files = [...event.target.files]
  event.target.value = ''
  draftPhotos.value = [...draftPhotos.value, ...files]
}

async function persist(extra = {}) {
  error.value = null
  const result = await store.updateSession(props.session._id, { catches: catches.value, ...extra })
  if (!result) { error.value = store.error; return null }
  return result
}

async function saveFish() {
  if (!draft.value.species?.trim()) return
  saving.value = true
  const previous = catches.value
  const entry = { ...draft.value, species: draft.value.species.trim() }
  const index = editIndex.value ?? previous.length
  catches.value = editIndex.value === null
    ? [...previous, entry]
    : previous.map((c, i) => i === editIndex.value ? entry : c)

  const result = await persist()
  if (!result) {
    catches.value = previous // salvataggio rifiutato: la lista torna com'era
    saving.value = false
    return
  }

  // Le foto si caricano dopo il salvataggio, quando la cattura ha un _id reale.
  const savedCatch = result.catches?.[index]
  if (draftPhotos.value.length) {
    if (savedCatch?._id) {
      await store.uploadCatchMedia(props.session._id, savedCatch._id, draftPhotos.value)
      const fresh = await store.fetchSession(props.session._id)
      if (fresh?.catches) catches.value = fresh.catches.map(c => ({ ...c }))
    } else {
      toast(t('session.ongoing.photosOffline'), { type: 'warning' })
    }
  } else if (result.catches) {
    // allinea gli _id assegnati dal server (servono per le foto successive)
    catches.value = result.catches.map(c => ({ ...c }))
  }

  saving.value = false
  sheet.value = false
  toast(t('session.ongoing.fishSaved'), { type: 'success' })
}

async function removeFish() {
  const previous = catches.value
  catches.value = previous.filter((_, i) => i !== editIndex.value)
  const result = await persist()
  if (!result) { catches.value = previous; return }
  if (result.catches) catches.value = result.catches.map(c => ({ ...c }))
  sheet.value = false
}

// ─── Chiusura ────────────────────────────────────────────────────────────────

async function closeSession() {
  closing.value = true
  const result = await persist({ status: 'closed' })
  closing.value = false
  if (!result) return
  toast(t('session.ongoing.closed'), { type: 'success' })
  emit('closed', result)
}

onBeforeUnmount(() => { sheet.value = false })
</script>

<style scoped>
.ongoing { display: flex; flex-direction: column; gap: 1.25rem; max-width: 640px; }

.ongoing-head { align-items: flex-start; display: flex; gap: 1rem; justify-content: space-between; }
.ongoing-head h3 { color: var(--foam, #cde); font-size: 1.2rem; font-weight: 700; margin: 0; }
.ongoing-badge { color: var(--success, #5cd98a); font-size: .72rem; font-weight: 800; letter-spacing: .06em; margin-bottom: .2rem; text-transform: uppercase; }
.ongoing-meta { color: var(--text-muted, #6b8fa8); font-size: .85rem; margin-top: .2rem; }
.link-btn { background: none; border: none; color: var(--ocean, #0ea5e9); cursor: pointer; font-size: .85rem; padding: .5rem 0; text-align: right; }

.error-banner {
  align-items: center; background: rgba(240, 80, 80, .1); border: 1px solid var(--danger, #f05050);
  border-radius: 6px; color: var(--danger, #f05050); display: inline-flex; gap: .4rem; padding: .75rem 1rem;
}

.add-btn { align-items: center; display: flex; font-size: 1.1rem; gap: .5rem; justify-content: center; min-height: 60px; width: 100%; }

.fish-list h4 { color: var(--foam, #cde); font-size: 1.05rem; font-weight: 700; margin: 0 0 .6rem; }
.fish-list ul { display: flex; flex-direction: column; gap: .5rem; list-style: none; margin: 0; padding: 0; }
.empty { color: var(--text-muted, #6b8fa8); font-size: .9rem; }
.fish-card {
  align-items: center; background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55);
  border-radius: 12px; color: var(--foam, #cde); cursor: pointer; display: flex;
  gap: .75rem; justify-content: space-between; min-height: 60px; padding: .75rem 1rem; text-align: left; width: 100%;
}
.fish-card:hover { border-color: var(--ocean, #0ea5e9); }
.fish-main { display: flex; flex-direction: column; gap: .15rem; }
.fish-sub { color: var(--text-muted, #6b8fa8); font-size: .82rem; }
.fish-tags { align-items: center; display: flex; gap: .4rem; }
.tag { align-items: center; color: var(--success, #5cd98a); display: inline-flex; font-size: .75rem; gap: .2rem; }
.fish-go { color: var(--text-muted, #6b8fa8); }

.finish { border-top: 1px solid var(--border, #2a3f55); display: flex; flex-direction: column; gap: .5rem; padding-top: 1.25rem; }
.finish-btn { min-height: 48px; width: 100%; }
.finish p { color: var(--text-muted, #6b8fa8); font-size: .78rem; text-align: center; }

.sheet-overlay { align-items: flex-end; background: rgba(0, 0, 0, .6); display: flex; inset: 0; justify-content: center; position: fixed; z-index: 1000; }
.sheet-overlay.center { align-items: center; }
.sheet {
  background: var(--bg, #0d1b2a); border-radius: 18px 18px 0 0; display: flex; flex-direction: column;
  max-height: 92vh; max-width: 640px; overflow-y: auto; padding: 1rem 1.1rem 1.25rem; width: 100%;
}
.sheet-head { align-items: center; display: flex; justify-content: space-between; margin-bottom: .75rem; }
.sheet-head h3 { color: var(--foam, #cde); font-size: 1.15rem; margin: 0; }
.icon-btn { background: none; border: none; color: var(--text-muted, #6b8fa8); cursor: pointer; padding: .5rem; }
.sheet-body { display: flex; flex-direction: column; gap: 1rem; }

.chosen { align-items: center; background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55); border-radius: 10px; color: var(--foam, #cde); display: flex; font-size: 1.1rem; justify-content: space-between; padding: .6rem .9rem; }
.two-cols { display: grid; gap: .75rem; grid-template-columns: 1fr 1fr; }
.field { display: flex; flex-direction: column; gap: .3rem; }
.field span { color: var(--text-muted, #6b8fa8); font-size: .78rem; font-weight: 700; }
.field input { min-height: 48px; }
.switch-line { align-items: center; display: flex; gap: .6rem; min-height: 44px; }
.switch-line input { height: 22px; width: 22px; }
.photo-line { align-items: center; display: flex; flex-wrap: wrap; gap: .5rem; }
.photo-line .btn { align-items: center; cursor: pointer; display: inline-flex; gap: .4rem; }
.photo-count { color: var(--success, #5cd98a); font-size: .8rem; }
.more-btn { align-self: flex-start; padding-left: 0; }
.more { display: flex; flex-direction: column; gap: .75rem; }
.more-hint { color: var(--text-muted, #6b8fa8); font-size: .75rem; }

.sheet-actions { align-items: center; display: flex; gap: .75rem; justify-content: space-between; margin-top: 1.25rem; }
.save-btn { flex: 1; min-height: 52px; }

.dialog { max-width: 22rem; width: 90%; }
.dialog-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
</style>

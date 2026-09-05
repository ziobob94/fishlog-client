<template>
  <div class="catches-wrap">

    <SpeciesQuickAdd v-model="searchQuery" :location="location" @add="addSpecies">
      <template #actions>
        <button type="button" class="btn btn-primary btn-sm" @click="add">{{ t('catchesSection.add') }}</button>
      </template>
    </SpeciesQuickAdd>

    <div v-if="modelValue.length" class="catches-table">
      <div class="catches-row catches-head">
        <span>{{ t('catchesSection.speciesLabel') }}</span>
        <span>{{ t('catchesSection.weightLabel') }}</span>
        <span>{{ t('catchesSection.lengthLabel') }}</span>
        <span></span>
        <span></span>
      </div>

      <template v-for="(c, i) in modelValue" :key="i">
        <div class="catches-row" @click="toggle(i)">
          <div class="row-fields">
            <div class="field species-field">
              <span class="mobile-label">{{ t('catchesSection.speciesLabel') }}</span>
              <input
                v-model="c.species" type="text" :placeholder="t('catchesSection.speciesPlaceholder')" required
                @click.stop
                @input="onSpeciesInput(i, c.species)"
                @focus.stop="onSpeciesInput(i, c.species)"
                @blur="closeSpeciesResultsSoon"
              />
              <ul v-if="speciesSearchIndex === i && speciesResults.length" class="species-results" @mousedown.prevent>
                <li v-for="r in speciesResults" :key="r.gbifKey || r._id" @click="pickSpecies(i, r)">
                  {{ r.commonNameIt || r.commonNameEn || r.scientificName }}
                  <span class="scientific">{{ r.scientificName }}</span>
                </li>
              </ul>
            </div>
            <div class="field">
              <span class="mobile-label">{{ t('catchesSection.weightLabel') }}</span>
              <input v-model.number="c.weightKg" type="number" step="0.01" min="0" :placeholder="t('catchesSection.weightPlaceholder')" @click.stop />
            </div>
            <div class="field">
              <span class="mobile-label">{{ t('catchesSection.lengthLabel') }}</span>
              <input v-model.number="c.lengthCm" type="number" step="0.5" min="0" :placeholder="t('catchesSection.lengthPlaceholder')" @click.stop />
            </div>
          </div>

          <div class="row-actions">
            <span v-show="c.released" class="released-badge" @click.stop :title="t('catchesSection.releasedLabel')">↺</span>
            <div class="row-photo-actions" @click.stop>
              <label class="row-icon-btn" :title="t('catchesSection.takePhoto')">
                <Camera :size="18" />
                <input type="file" accept="image/*" capture="environment" class="sr-only" @change="onPhotoPick(i, $event)" />
              </label>
              <label class="row-icon-btn" :title="t('catchesSection.uploadPhoto')">
                <Upload :size="18" />
                <input type="file" accept="image/*,video/*" multiple class="sr-only" @change="onPhotoPick(i, $event)" />
              </label>
              <span v-if="pendingFiles.get(i)?.length" class="row-photo-count">{{ pendingFiles.get(i).length }}</span>
            </div>
            <button type="button" class="row-icon-btn row-remove" @click.stop="removeTarget = i" :title="t('baitsSection.remove')"><Trash2 :size="18" /></button>
            <button type="button" class="row-icon-btn row-chevron" :class="{ open: expanded.has(i) }" @click.stop="toggle(i)"><ChevronDown :size="18" /></button>
          </div>
        </div>

        <div v-if="expanded.has(i)" class="catches-detail">

          <div class="mini-accordion">
            <button type="button" class="mini-header" @click="toggleSub(i, 'details')">
              <span>{{ t('catchesSection.detailsSubtitle') }}</span>
              <span class="chevron" :class="{ open: isSubOpen(i, 'details') }">▸</span>
            </button>
            <div class="form-grid" v-if="isSubOpen(i, 'details')">
              <div class="form-group">
                <label>{{ t('catchesSection.timeLabel') }}<FieldInfo :text="t('catchesSection.timeInfo')" /></label>
                <input v-model="c.time" type="time" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.distanceLabel') }}<FieldInfo :text="t('catchesSection.distanceInfo')" /></label>
                <input v-model.number="c.distance" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.directionLabel') }}<FieldInfo :text="t('catchesSection.directionInfo')" /></label>
                <input v-model="c.direction" type="text" :placeholder="t('catchesSection.directionPlaceholder')" />
              </div>
              <div class="form-group full">
                <label>{{ t('catchesSection.notesLabel') }}<FieldInfo :text="t('catchesSection.notesInfo')" /></label>
                <input v-model="c.notes" type="text" :placeholder="t('catchesSection.notesPlaceholder')" />
              </div>
            </div>
          </div>

          <div class="mini-accordion">
            <button type="button" class="mini-header" @click="toggleSub(i, 'bait')">
              <span>{{ t('catchesSection.baitSubtitle') }}</span>
              <span class="chevron" :class="{ open: isSubOpen(i, 'bait') }">▸</span>
            </button>
            <div class="form-grid" v-if="isSubOpen(i, 'bait')">
              <div class="form-group">
                <label>{{ t('catchesSection.baitUsedLabel') }}<FieldInfo :text="t('catchesSection.baitUsedInfo')" /></label>
                <input v-model="c.baitUsed" type="text" list="bait-suggestions" :placeholder="t('catchesSection.baitUsedPlaceholder')" @change="applyBaitType(c)" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.baitTypeLabel') }}<FieldInfo :text="t('catchesSection.baitTypeInfo')" /></label>
                <select v-model="c.baitType">
                  <option value="">--</option>
                  <option value="naturale">{{ t('catchesSection.baitTypeNatural') }}</option>
                  <option value="artificiale">{{ t('catchesSection.baitTypeArtificial') }}</option>
                  <option value="misto">{{ t('catchesSection.baitTypeMixed') }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.baitPresentationLabel') }}<FieldInfo :text="t('catchesSection.baitPresentationInfo')" /></label>
                <input v-model="c.baitPresentation" type="text" />
              </div>
            </div>
          </div>

          <div class="mini-accordion">
            <button type="button" class="mini-header" @click="toggleSub(i, 'rig')">
              <span>{{ t('catchesSection.rigSubtitle') }}</span>
              <span class="chevron" :class="{ open: isSubOpen(i, 'rig') }">▸</span>
            </button>
            <div class="form-grid" v-if="isSubOpen(i, 'rig')">
              <div class="form-group">
                <label>{{ t('catchesSection.rigUsedLabel') }}<FieldInfo :text="t('catchesSection.rigUsedInfo')" /></label>
                <input v-model="c.rigUsed" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.rigTypeLabel') }}<FieldInfo :text="t('catchesSection.rigTypeInfo')" /></label>
                <input v-model="c.rigType" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.hookSizeLabel') }}<FieldInfo :text="t('catchesSection.hookSizeInfo')" /></label>
                <input v-model="c.hookSize" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.hookTypeLabel') }}<FieldInfo :text="t('catchesSection.hookTypeInfo')" /></label>
                <input v-model="c.hookType" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.sinkerWeightLabel') }}<FieldInfo :text="t('catchesSection.sinkerWeightInfo')" /></label>
                <input v-model.number="c.sinkerWeight" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.sinkerTypeLabel') }}<FieldInfo :text="t('catchesSection.sinkerTypeInfo')" /></label>
                <input v-model="c.sinkerType" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.lineMainLabel') }}<FieldInfo :text="t('catchesSection.lineMainInfo')" /></label>
                <input v-model.number="c.lineMainLb" type="number" step="0.1" min="0" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.leaderLabel') }}<FieldInfo :text="t('catchesSection.leaderInfo')" /></label>
                <input v-model.number="c.leaderLb" type="number" step="0.1" min="0" />
              </div>
              <div class="form-group">
                <label>{{ t('catchesSection.swivelLabel') }}<FieldInfo :text="t('catchesSection.swivelInfo')" /></label>
                <input v-model="c.swivel" type="text" />
              </div>
            </div>
          </div>

          <div class="mini-accordion">
            <button type="button" class="mini-header" @click="toggleSub(i, 'photos')">
              <span>{{ t('catchesSection.photoSubtitle') }}{{ pendingFiles.get(i)?.length ? ` (${pendingFiles.get(i).length})` : '' }}</span>
              <span class="chevron" :class="{ open: isSubOpen(i, 'photos') }">▸</span>
            </button>
            <div class="photo-panel" v-if="isSubOpen(i, 'photos')">
              <p class="photo-hint">{{ t('catchesSection.photoHint') }}</p>
              <div class="photo-grid">
                <div v-for="p in pendingFiles.get(i) || []" :key="p.id" class="photo-thumb">
                  <img v-if="p.file.type.startsWith('image/')" :src="p.url" />
                  <div v-else class="photo-thumb-video"><Camera :size="20" /></div>
                  <button type="button" class="photo-thumb-remove" @click="removePendingPhoto(i, p.id)"><X :size="12" /></button>
                </div>
                <label class="photo-add" :title="t('catchesSection.takePhoto')">
                  <Camera :size="18" />
                  <input type="file" accept="image/*" capture="environment" class="sr-only" @change="onPhotoPick(i, $event)" />
                </label>
                <label class="photo-add" :title="t('catchesSection.uploadPhoto')">
                  <Upload :size="18" />
                  <input type="file" accept="image/*,video/*" multiple class="sr-only" @change="onPhotoPick(i, $event)" />
                </label>
              </div>
            </div>
          </div>

          <div class="detail-footer">
            <label class="switch-row">
              <span class="switch" :class="{ on: c.released }">
                <input type="checkbox" v-model="c.released" />
                <span class="switch-knob"></span>
              </span>
              <span class="switch-text">{{ t('catchesSection.releasedLabel') }}</span>
            </label>
          </div>
        </div>
      </template>
    </div>

    <p v-else class="catches-empty">{{ t('catchesSection.empty') }}</p>

    <datalist id="bait-suggestions">
      <option v-for="b in baitSuggestions" :key="b" :value="b" />
    </datalist>

    <Teleport to="body">
      <div v-if="removeTarget !== null" class="dialog-overlay" @click.self="removeTarget = null">
        <div class="card dialog">
          <h3>{{ t('catchesSection.deleteDialog.title') }}</h3>
          <p class="text-muted mt-1">{{ t('catchesSection.deleteDialog.confirm') }}</p>
          <div class="dialog-actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="removeTarget = null">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-danger btn-sm" @click="confirmRemove">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Camera, Trash2, X, Upload, ChevronDown } from 'lucide-vue-next'
import SpeciesQuickAdd from './SpeciesQuickAdd.vue'
import FieldInfo from '../FieldInfo.vue'
import { useBaitSuggestions } from '../../composables/useBaitSuggestions.js'
import { useToast } from '../../composables/useToast.js'
import { useSpecies } from '../../composables/useSpecies.js'
import { useDebouncedFn } from '../../composables/useDebouncedFn.js'

const { t } = useI18n()
const { toast } = useToast()
const { fetchBaitSuggestions, fetchBaitCatalog } = useBaitSuggestions()
const { searchSpecies } = useSpecies()

const baitSuggestions = ref([])
const baitTypeByName  = ref(new Map())

onMounted(async () => {
  try { baitSuggestions.value = await fetchBaitSuggestions() } catch { /* suggerimenti opzionali */ }
  try {
    const catalog = await fetchBaitCatalog()
    baitTypeByName.value = new Map(catalog.map(b => [b.name.toLowerCase(), b.type]))
  } catch { /* auto-fill tipo opzionale */ }
})

// Se l'esca scritta/scelta corrisponde a una voce nota del catalogo,
// precompila il tipo — resta comunque modificabile o lasciabile vuoto
// per le esche non standard.
function applyBaitType(c) {
  const type = baitTypeByName.value.get((c.baitUsed || '').trim().toLowerCase())
  if (type && !c.baitType) c.baitType = type
}
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  location:   { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue'])

const empty = () => ({
  species: '', weightKg: null, lengthCm: null, released: false,
  time: '', distance: null, direction: '', notes: '',
  baitUsed: '', baitType: '', baitPresentation: '',
  rigUsed: '', rigType: '', hookSize: '', hookType: '',
  sinkerWeight: null, sinkerType: '', lineMainLb: null, leaderLb: null, swivel: ''
})

const expanded = ref(new Set())
const searchQuery = ref('')

// Autocomplete specie sul campo della riga compatta (stessa ricerca globale
// usata nella barra di ricerca principale).
const speciesResults = ref([])
const speciesSearchIndex = ref(null)
let closeTimer = null

const runSpeciesSearch = useDebouncedFn(async (i, q) => {
  const results = await searchSpecies(q)
  if (speciesSearchIndex.value === i) speciesResults.value = results
}, 300)

function onSpeciesInput(i, value) {
  clearTimeout(closeTimer)
  speciesSearchIndex.value = i
  const q = (value || '').trim()
  if (q.length < 2) { speciesResults.value = []; return }
  runSpeciesSearch(i, q)
}

function pickSpecies(i, r) {
  const arr = [...props.modelValue]
  arr[i] = { ...arr[i], species: r.commonNameIt || r.commonNameEn || r.scientificName }
  emit('update:modelValue', arr)
  speciesSearchIndex.value = null
  speciesResults.value = []
}

function closeSpeciesResultsSoon() {
  // piccolo ritardo per non chiudere prima che il click su un suggerimento arrivi
  closeTimer = setTimeout(() => { speciesSearchIndex.value = null }, 150)
}

// Mini-accordion dentro il pannello di dettaglio di ogni cattura: quali
// sotto-sezioni (dettagli/esca/montatura) sono aperte, per indice di riga.
const openSubs = ref(new Map())

function isSubOpen(i, id) {
  return openSubs.value.get(i)?.has(id) ?? false
}

// Foto scelte per una cattura mentre si compila il form: restano locali
// (anteprima via object URL) e vengono caricate sul server solo dopo il
// salvataggio della sessione, quando la cattura ha un _id reale.
const pendingFiles = ref(new Map())
let nextPhotoId = 0

function onPhotoPick(i, event) {
  const files = [...event.target.files]
  event.target.value = ''
  if (!files.length) return
  const next = new Map(pendingFiles.value)
  const list = [...(next.get(i) ?? [])]
  for (const file of files) list.push({ id: ++nextPhotoId, file, url: URL.createObjectURL(file) })
  next.set(i, list)
  pendingFiles.value = next
}

function removePendingPhoto(i, id) {
  const next = new Map(pendingFiles.value)
  const list = next.get(i) ?? []
  const target = list.find(p => p.id === id)
  if (target) URL.revokeObjectURL(target.url)
  next.set(i, list.filter(p => p.id !== id))
  pendingFiles.value = next
}

onBeforeUnmount(() => {
  for (const list of pendingFiles.value.values()) {
    for (const p of list) URL.revokeObjectURL(p.url)
  }
})

// Esposto al form padre: solo i File grezzi, pronti per l'upload dopo il salvataggio.
const pendingPhotosByIndex = computed(() => {
  const map = new Map()
  for (const [i, list] of pendingFiles.value) {
    if (list.length) map.set(i, list.map(p => p.file))
  }
  return map
})
// Esposto al form padre: libera le anteprime locali di un indice dopo che
// le foto sono state caricate sul server (evita di ricaricarle ad ogni
// nuovo salvataggio automatico).
function clearPendingPhotos(i) {
  const next = new Map(pendingFiles.value)
  const list = next.get(i) ?? []
  for (const p of list) URL.revokeObjectURL(p.url)
  next.delete(i)
  pendingFiles.value = next
}
defineExpose({ pendingPhotosByIndex, clearPendingPhotos })

function toggleSub(i, id) {
  const next = new Map(openSubs.value)
  const set = new Set(next.get(i) ?? [])
  set.has(id) ? set.delete(id) : set.add(id)
  next.set(i, set)
  openSubs.value = next
}

function toggle(i) {
  const next = new Set(expanded.value)
  if (next.has(i)) {
    next.delete(i)
  } else {
    next.add(i)
    // apre il pannello mostrando solo la prima sotto-sezione, non tutto insieme
    const nextSubs = new Map(openSubs.value)
    nextSubs.set(i, new Set(['details']))
    openSubs.value = nextSubs
  }
  expanded.value = next
}

function addCatch(species) {
  // Non ha senso avere due catture entrambe senza specie: si riapre e si
  // segnala quella già vuota invece di accumularne un'altra.
  const emptyIndex = props.modelValue.findIndex(c => !c.species?.trim())
  if (!species && emptyIndex !== -1) {
    expanded.value = new Set([emptyIndex])
    toast(t('catchesSection.alreadyEmpty'), { type: 'warning' })
    return
  }

  const index = props.modelValue.length
  emit('update:modelValue', [...props.modelValue, { ...empty(), species }])
  expanded.value = new Set([index]) // apre solo la nuova riga, in modo compatto
  openSubs.value = new Map([[index, new Set(['details'])]])
  searchQuery.value = ''
}

function add() {
  addCatch(searchQuery.value.trim())
}

function addSpecies(species) {
  addCatch(species)
}

const removeTarget = ref(null)

function remove(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
  const next = new Set([...expanded.value].filter(x => x !== i).map(x => x > i ? x - 1 : x))
  expanded.value = next

  const nextSubs = new Map()
  for (const [idx, set] of openSubs.value) {
    if (idx === i) continue
    nextSubs.set(idx > i ? idx - 1 : idx, set)
  }
  openSubs.value = nextSubs

  const nextPhotos = new Map()
  for (const [idx, list] of pendingFiles.value) {
    if (idx === i) { for (const p of list) URL.revokeObjectURL(p.url); continue }
    nextPhotos.set(idx > i ? idx - 1 : idx, list)
  }
  pendingFiles.value = nextPhotos
}

function confirmRemove() {
  remove(removeTarget.value)
  removeTarget.value = null
}
</script>

<style scoped>
.catches-wrap { display: flex; flex-direction: column; gap: .75rem; }
.icon-inline { display: inline-flex; align-items: center; gap: .4rem; }

.catches-table {
  border: 1px solid var(--border, #2a3f55);
  border-radius: 10px;
  overflow: hidden;
}

.catches-row {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: .6rem;
  padding: .65rem .75rem;
}
.catches-row + .catches-row,
.catches-detail + .catches-row {
  border-top: 1px solid var(--border, #2a3f55);
}
.catches-row input { cursor: auto; }

.row-fields {
  display: grid;
  gap: .6rem;
  grid-template-columns: 2fr 1fr 1fr;
}

.row-actions {
  align-items: center;
  display: flex;
  gap: .5rem;
  justify-content: flex-end;
}

.field { display: flex; flex-direction: column; gap: .2rem; min-width: 0; }
.species-field { position: relative; }

.species-results {
  background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55);
  border-radius: 8px; list-style: none; margin-top: .25rem; max-height: 220px;
  overflow-y: auto; position: absolute; top: 100%; width: max(100%, 220px); z-index: 30;
}
.species-results li {
  border-bottom: 1px solid var(--border, #2a3f55); color: var(--foam, #cde);
  cursor: pointer; display: flex; flex-direction: column; font-size: .85rem;
  gap: .1rem; padding: .5rem .75rem;
}
.species-results li:last-child { border-bottom: none; }
.species-results li:hover { background: var(--ocean-glow); }
.species-results .scientific { color: var(--text-muted, #6b8fa8); font-size: .72rem; font-style: italic; }
.mobile-label { display: none; }

.catches-head {
  background: var(--surface-2, #0d2035);
  cursor: default;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .05em;
  padding: .5rem .75rem;
  text-transform: uppercase;
  color: var(--text-muted, #6b8fa8);
}
.catches-head span:nth-child(1) { padding-left: .1rem; }

.released-badge {
  align-items: center; color: var(--success, #5cd98a); cursor: default;
  display: flex; font-size: 1.05rem; justify-content: center;
}

/* Pulsanti icona della riga: dimensione e distanza pensate per non
   cliccare quello sbagliato per errore (area di tocco ~32px, sfondo
   visibile su hover/focus, ben distanziati tra loro). */
.row-icon-btn {
  align-items: center; background: var(--surface, #0a1929);
  border: 1px solid var(--border, #2a3f55); border-radius: 8px;
  color: var(--text-muted, #6b8fa8); cursor: pointer; display: flex;
  height: 34px; justify-content: center; transition: color .15s, border-color .15s, background .15s;
  width: 34px;
}
.row-icon-btn:hover { background: var(--surface-2, #0d2035); border-color: var(--ocean, #0ea5e9); color: var(--ocean, #0ea5e9); }

.row-chevron { transition: transform .15s, color .15s, border-color .15s, background .15s; }
.row-chevron.open { transform: rotate(180deg); }

.row-remove:hover { border-color: var(--danger, #f05050); color: var(--danger, #f05050); }

.row-photo-actions { align-items: center; display: flex; gap: .5rem; position: relative; }
.row-photo-count {
  background: var(--ocean, #0ea5e9); border-radius: 999px; color: #fff;
  font-size: .62rem; font-weight: 700; line-height: 1; padding: .15rem .35rem;
  position: absolute; right: -.4rem; top: -.4rem;
}

.catches-detail {
  background: var(--surface-2, #0d2035);
  border-top: 1px solid var(--border, #2a3f55);
  display: flex;
  flex-direction: column;
  gap: .75rem;
  padding: 1rem .75rem;
}

.mini-accordion { border: 1px solid var(--border, #2a3f55); border-radius: 8px; overflow: hidden; }
.mini-accordion + .mini-accordion { margin-top: .6rem; }
.mini-accordion .form-grid { padding: .85rem .75rem; }

.mini-header {
  align-items: center; background: var(--surface, #0a1929); border: none;
  color: var(--text-muted, #6b8fa8); cursor: pointer; display: flex;
  font-size: .7rem; font-weight: 700; justify-content: space-between;
  letter-spacing: .05em; padding: .6rem .75rem; text-transform: uppercase;
  transition: color .15s; width: 100%;
}
.mini-header:hover { color: var(--foam, #cde); }
.mini-header .chevron { font-size: .7rem; transition: transform .15s; }
.mini-header .chevron.open { transform: rotate(90deg); }

.photo-panel { padding: .85rem .75rem; }
.photo-hint { color: var(--text-muted, #6b8fa8); font-size: .78rem; font-style: italic; margin-bottom: .6rem; }

.photo-grid { display: flex; flex-wrap: wrap; gap: .6rem; }

.photo-thumb {
  background: var(--surface, #0a1929); border: 1px solid var(--border, #2a3f55);
  border-radius: 8px; height: 64px; overflow: hidden; position: relative; width: 64px;
}
.photo-thumb img { height: 100%; object-fit: cover; width: 100%; }
.photo-thumb-video {
  align-items: center; color: var(--text-muted, #6b8fa8); display: flex;
  height: 100%; justify-content: center; width: 100%;
}
.photo-thumb-remove {
  align-items: center; background: rgba(0, 0, 0, .65); border: none;
  border-radius: 50%; color: #fff; cursor: pointer; display: flex;
  height: 18px; justify-content: center; position: absolute; right: 3px; top: 3px; width: 18px;
}

.photo-add {
  align-items: center; border: 1px dashed var(--border, #2a3f55); border-radius: 8px;
  color: var(--text-muted, #6b8fa8); cursor: pointer; display: flex;
  height: 64px; justify-content: center; transition: border-color .15s, color .15s; width: 64px;
}
.photo-add:hover { border-color: var(--ocean, #0ea5e9); color: var(--ocean, #0ea5e9); }
.sr-only { border: 0; clip: rect(0,0,0,0); height: 1px; overflow: hidden; padding: 0; position: absolute; width: 1px; }

.detail-footer {
  align-items: center; border-top: 1px solid var(--border, #2a3f55);
  display: flex; justify-content: space-between; padding-top: .85rem;
}

.switch-row { align-items: center; cursor: pointer; display: flex; gap: .6rem; }
.switch-text { color: var(--foam, #cde); font-size: .85rem; font-weight: 600; }

.switch {
  background: var(--border, #2a3f55);
  border-radius: 999px;
  display: inline-block;
  height: 22px;
  position: relative;
  transition: background-color .2s;
  width: 40px;
}
.switch.on { background: var(--success, #5cd98a); }
.switch input {
  height: 100%; left: 0; margin: 0; opacity: 0;
  position: absolute; top: 0; width: 100%; cursor: pointer;
}
.switch-knob {
  background: #fff; border-radius: 50%; height: 16px;
  left: 3px; position: absolute; top: 3px;
  transition: transform .2s; width: 16px;
}
.switch.on .switch-knob { transform: translateX(18px); }

.catches-empty {
  color: var(--text-muted, #6b8fa8);
  font-size: .85rem;
  font-style: italic;
}

.dialog-overlay {
  align-items: center; background: rgba(0, 0, 0, .6); display: flex;
  inset: 0; justify-content: center; position: fixed; z-index: 1000;
}
.dialog { max-width: 22rem; width: 90%; }
.dialog-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }

@media (max-width: 640px) {
  .catches-head { display: none; }
  .mobile-label {
    display: block; color: var(--text-muted, #6b8fa8);
    font-size: .68rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
  }
  .catches-row { flex-direction: column; }
  .row-fields {
    grid-template-columns: 1fr 1fr;
  }
  .species-field { grid-column: 1 / -1; }
  .row-actions { justify-content: space-between; }

  .detail-footer { flex-wrap: wrap; gap: .75rem; }
}
</style>

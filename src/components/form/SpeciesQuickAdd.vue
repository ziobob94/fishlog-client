<template>
  <div class="species-quickadd">

    <label v-if="showLabel" class="fl-lab" for="species-quickadd-input">{{ t('speciesQuickAdd.label') }}</label>
    <div class="quickadd-toolbar">
      <div class="species-search-bar">
        <Search :size="22" class="search-icon" aria-hidden="true" />
        <input id="species-quickadd-input" v-model="query" type="text" autocomplete="off" class="fl-inp search-input" :aria-label="t('speciesQuickAdd.searchAria')" :placeholder="t('speciesQuickAdd.searchPlaceholder')" />
      </div>
      <slot name="actions" />
    </div>

    <!-- Segnalazione pesce mancante -->
    <div v-if="reporting" class="report-box">
      <input v-model="reportNote" type="text" :placeholder="t('speciesQuickAdd.reportNotePlaceholder')" />
      <button type="button" class="btn btn-secondary btn-sm" @click="submitReport">{{ t('speciesQuickAdd.reportSend') }}</button>
      <button type="button" class="btn btn-ghost btn-sm" @click="reporting = false">{{ t('common.cancel') }}</button>
    </div>
    <p v-if="reportSent" class="report-sent">{{ t('speciesQuickAdd.reportSent') }}</p>

    <!-- Risultati della ricerca live oppure specie frequenti: chip tappabili (la scelta è evidenziata) -->
    <div v-if="isSearching" class="chip-block">
      <p class="fl-hint chip-title">{{ t('speciesQuickAdd.resultsTitle') }}</p>
      <div class="chip-row">
        <button v-for="r in results" :key="r.gbifKey || r._id" type="button" class="fl-chip" :class="{ on: isSelected(r.commonNameIt || r.commonNameEn || r.scientificName) }" @click="pick(r)">
          {{ r.commonNameIt || r.commonNameEn || r.scientificName }}
        </button>
      </div>
    </div>
    <div v-else-if="suggestions.length || selected" class="chip-block">
      <p class="fl-hint chip-title">{{ t('speciesQuickAdd.suggestionsTitle') }}</p>
      <div class="chip-row">
        <button v-if="selected && !suggestions.some(s => isSelected(s.species))" type="button" class="fl-chip on" aria-pressed="true">{{ selected }}</button>
        <button v-for="s in suggestions" :key="s.species" type="button" class="fl-chip" :class="{ on: isSelected(s.species) }" :aria-pressed="isSelected(s.species)" @click="pick({ commonNameIt: s.species })">
          {{ s.species }}<template v-if="s.count != null"> · {{ t('speciesQuickAdd.caughtHere', { n: s.count }, s.count) }}</template>
        </button>
      </div>
    </div>

    <p v-if="isSearching && !loadingSearch && results.length === 0" class="no-results">
      <span>{{ t('speciesQuickAdd.noResults') }}</span>
      <button type="button" class="btn-link" @click="openReport">{{ t('speciesQuickAdd.reportMissing') }}</button>
    </p>

  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useSpecies } from '../../composables/useSpecies.js'
import { useDebouncedFn } from '../../composables/useDebouncedFn.js'

const { t } = useI18n()
const { fetchSuggestions, searchSpecies, reportMissingSpecies } = useSpecies()

const props = defineProps({
  location: { type: Object, default: () => ({}) },
  modelValue: { type: String, default: '' },
  selected: { type: String, default: '' },     // specie già scelta: evidenziata tra i chip
  showLabel: { type: Boolean, default: true }
})
const isSelected = name => !!props.selected && (name || '').toLowerCase() === props.selected.toLowerCase()
const emit = defineEmits(['add', 'update:modelValue'])

// ─── Suggerimenti per posizione ────────────────────────────────────────────

const suggestions = ref([])

async function loadSuggestions() {
  const { lat, lng } = props.location?.coords || {}
  const region = props.location?.region
  try {
    suggestions.value = await fetchSuggestions({ lat, lng, region })
  } catch {
    suggestions.value = []
  }
}

watch(
  () => [props.location?.coords?.lat, props.location?.coords?.lng, props.location?.region],
  loadSuggestions,
  { immediate: true }
)

// ─── Ricerca manuale globale ────────────────────────────────────────────────

const query = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
const results       = ref([])
const loadingSearch = ref(false)
const isSearching   = computed(() => query.value.trim().length >= 2)

const runSearch = useDebouncedFn(async (q) => {
  loadingSearch.value = true
  try {
    results.value = await searchSpecies(q)
  } finally {
    loadingSearch.value = false
  }
}, 350)

watch(query, q => {
  reportSent.value = false
  if (q.trim().length < 2) { results.value = []; return }
  runSearch(q)
})

function pick(r) {
  emit('add', r.commonNameIt || r.commonNameEn || r.scientificName)
  query.value = ''
  results.value = []
}

// ─── Segnalazione pesce mancante ────────────────────────────────────────────

const reporting   = ref(false)
const reportNote  = ref('')
const reportSent  = ref(false)

function openReport() {
  reporting.value = true
}

async function submitReport() {
  try {
    await reportMissingSpecies(query.value.trim(), reportNote.value.trim())
    reportSent.value = true
    reporting.value  = false
    reportNote.value = ''
  } catch { /* segnalazione non critica: fallisce in silenzio */ }
}
</script>

<style scoped>
.species-quickadd { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 0; }
.quickadd-toolbar { align-items: flex-start; display: flex; gap: .75rem; }
.species-search-bar { flex: 1; position: relative; }
.search-icon { color: var(--text-muted); left: 14px; pointer-events: none; position: absolute; top: 15px; }
.search-input { padding-left: 46px; }
.chip-title { margin: 0 0 10px; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.no-results { align-items: center; color: var(--text-muted); display: flex; font-size: .82rem; gap: .5rem; justify-content: space-between; }
.btn-link { background: none; border: none; color: var(--ocean); cursor: pointer; font-size: .8rem; text-decoration: underline; }
.report-box { display: flex; flex-wrap: wrap; gap: .5rem; }
.report-sent { color: var(--success); font-size: .8rem; }
</style>

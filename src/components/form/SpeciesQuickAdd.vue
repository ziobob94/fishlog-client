<template>
  <div class="species-quickadd">

    <label class="quickadd-label" for="species-quickadd-input">{{ t('speciesQuickAdd.label') }}</label>
    <div class="quickadd-toolbar">
      <div class="species-search-bar">
        <input id="species-quickadd-input" v-model="query" type="text" autocomplete="off" :placeholder="t('speciesQuickAdd.searchPlaceholder')" />
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

    <!-- Risultati della ricerca live oppure specie suggerite: sempre chip
         tappabili con un titolo che spiega che toccandoli si aggiunge un pesce. -->
    <div v-if="isSearching" class="chip-block">
      <p class="chip-title">{{ t('speciesQuickAdd.resultsTitle') }}</p>
      <div class="chip-row">
        <button v-for="r in results" :key="r.gbifKey || r._id" type="button" class="species-chip" @click="pick(r)">
          <span class="chip-plus">+</span>
          <span class="chip-name">{{ r.commonNameIt || r.commonNameEn || r.scientificName }}</span>
          <span class="chip-sub scientific">{{ r.scientificName }}</span>
        </button>
      </div>
    </div>
    <div v-else-if="suggestions.length" class="chip-block">
      <p class="chip-title">{{ t('speciesQuickAdd.suggestionsTitle') }}</p>
      <div class="chip-row">
        <button v-for="s in suggestions" :key="s.species" type="button" class="species-chip" @click="pick({ commonNameIt: s.species })">
          <span class="chip-plus">+</span>
          <span class="chip-name">{{ s.species }}</span>
          <span v-if="s.count != null" class="chip-sub">{{ t('speciesQuickAdd.caughtHere', { n: s.count }, s.count) }}</span>
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
import { useI18n } from 'vue-i18n'
import { useSpecies } from '../../composables/useSpecies.js'
import { useDebouncedFn } from '../../composables/useDebouncedFn.js'

const { t } = useI18n()
const { fetchSuggestions, searchSpecies, reportMissingSpecies } = useSpecies()

const props = defineProps({
  location: { type: Object, default: () => ({}) },
  modelValue: { type: String, default: '' }
})
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
.species-quickadd { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1rem; }

.quickadd-toolbar { align-items: flex-start; display: flex; gap: .75rem; }
.species-search-bar { flex: 1; position: relative; }

.no-results {
  align-items: center; color: var(--text-muted, #6b8fa8); cursor: default;
  display: flex; font-size: .82rem; gap: .5rem; justify-content: space-between;
}
.btn-link {
  background: none; border: none; color: var(--ocean, #0ea5e9);
  cursor: pointer; font-size: .8rem; text-decoration: underline;
}

.report-box { display: flex; flex-wrap: wrap; gap: .5rem; }
.report-sent { color: var(--success, #5cd98a); font-size: .8rem; }

.quickadd-label { color: var(--foam, #cde); font-size: .95rem; font-weight: 700; }
.chip-title { color: var(--text-muted, #6b8fa8); font-size: .8rem; margin-bottom: .4rem; }
.chip-row { display: flex; flex-wrap: wrap; gap: .5rem; }
.species-chip {
  align-items: center; background: var(--surface, #0a1929);
  border: 1px solid var(--border, #2a3f55); border-radius: 999px; color: var(--foam, #cde);
  cursor: pointer; display: inline-flex; gap: .4rem; min-height: 40px; padding: .35rem .85rem;
}
.species-chip:hover, .species-chip:active { border-color: var(--ocean, #0ea5e9); }
.chip-plus { color: var(--ocean, #0ea5e9); font-weight: 800; }
.chip-name { font-size: .9rem; font-weight: 700; }
.chip-sub { color: var(--text-muted, #6b8fa8); font-size: .72rem; }
.chip-sub.scientific { font-style: italic; }
.suggestion-row {
  display: grid; gap: .6rem;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
}
.suggestion-card {
  background: var(--surface, #0a1929);
  border: 1px solid var(--border, #2a3f55);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: .3rem;
  padding: .9rem .75rem;
  text-align: left;
  transition: border-color .15s, transform .15s;
}
.suggestion-card:hover  { border-color: var(--ocean, #0ea5e9); transform: translateY(-2px); }
.suggestion-species { color: var(--foam, #cde); font-size: .9rem; font-weight: 700; }
.suggestion-count   { color: var(--text-muted, #6b8fa8); font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; }
.suggestion-count.scientific { font-style: italic; text-transform: none; letter-spacing: 0; }
</style>

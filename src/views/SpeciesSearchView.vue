<template>
  <div>
    <PageHeader :title="t('species.searchTitle')" back />

    <div class="search-wrap mb-3">
      <Search :size="16" class="search-icon" />
      <input
        v-model="query" type="search" :placeholder="t('species.searchPlaceholder')" :aria-label="t('species.searchPlaceholder')"
        class="search-input" @input="onInput"
      />
    </div>

    <!-- Risultati di ricerca -->
    <template v-if="searching">
      <div v-if="loading" class="state-center"><div class="m-spinner"></div></div>
      <div v-else-if="!results.length" class="empty">
        <p class="text-muted text-sm">{{ t('species.noResults') }}</p>
        <button type="button" class="btn btn-secondary mt-2" @click="showSeason">{{ t('species.showSeason') }}</button>
      </div>
      <div v-else class="species-grid">
        <RouterLink v-for="r in results" :key="r._id" :to="speciesLink(displayName(r))" class="species-card card">
          <img v-if="r.imageUrl" :src="r.imageUrl" alt="" class="species-thumb" />
          <div v-else class="species-thumb species-thumb-placeholder"><Fish :size="22" /></div>
          <div class="species-card-text">
            <strong>{{ displayName(r) }}</strong>
            <span class="scientific">{{ r.scientificName }}</span>
          </div>
          <ChevronRight :size="18" class="text-muted ml-auto shrink-0" />
        </RouterLink>
      </div>
    </template>

    <!-- Schede «In stagione» / «Tutte» -->
    <template v-else>
      <div class="tabs" role="tablist" :aria-label="t('species.tabsLabel')" @keydown="onTabKey">
        <button
          v-for="tb in tabs" :id="`tab-${tb}`" :key="tb" type="button" role="tab" class="tab"
          :aria-selected="tab === tb" :aria-controls="`panel-${tb}`" :tabindex="tab === tb ? 0 : -1" @click="tab = tb"
        >{{ t(`species.tab.${tb}`) }}</button>
      </div>

      <section v-if="tab === 'season'" id="panel-season" role="tabpanel" aria-labelledby="tab-season">
        <div class="season-head">
          <div class="min-w-0">
            <h2 class="season-title">{{ t('species.season.title') }}</h2>
            <p class="text-muted text-sm">{{ zoneLabel }}</p>
          </div>
          <button type="button" class="month-chip" aria-haspopup="dialog" :aria-label="t('species.season.changeMonth', { month: monthLabel })" @click="sheetOpen = true">
            <CalendarDays :size="14" aria-hidden="true" />{{ monthLabel }}<ChevronDown :size="14" aria-hidden="true" />
          </button>
        </div>
        <p class="indicative"><Info :size="14" aria-hidden="true" />{{ t('species.season.indicative') }}</p>

        <div v-if="!hasPlace" class="notice" role="status">
          <MapPin :size="16" aria-hidden="true" />
          <span class="grow">{{ t('species.season.noPosition') }}</span>
          <button type="button" class="btn btn-secondary btn-sm" :disabled="locating" @click="enableLocation">{{ t('species.season.enable') }}</button>
        </div>
        <p v-if="geoError" class="text-sm text-muted mb-2" role="status">{{ t('species.season.geoDenied') }}</p>
        <p v-if="offlineStamp" class="notice" role="status"><WifiOff :size="16" aria-hidden="true" />{{ t('species.season.offline', { time: offlineStamp }) }}</p>

        <div v-if="seasonState === 'loading'" class="state-center"><div class="m-spinner" role="status" :aria-label="t('common.loading')"></div></div>
        <div v-else-if="seasonState === 'error'" class="empty" role="alert">
          <p class="text-muted text-sm">{{ t('species.season.error') }}</p>
          <button type="button" class="btn btn-secondary mt-2" @click="loadSeason">{{ t('species.season.retry') }}</button>
        </div>
        <p v-else-if="seasonState === 'empty'" class="text-muted text-sm">{{ t('species.season.empty') }}</p>
        <ul v-else class="season-list">
          <li v-for="it in seasonItems" :key="it.name">
            <RouterLink :to="speciesLink(it.name)" class="season-row card">
              <div class="min-w-0 grow">
                <strong class="block truncate">{{ it.name }}</strong>
                <span class="scientific">{{ it.scientificName }}</span>
                <div class="season-meta">
                  <span class="level">{{ it.label }}</span>
                  <span v-if="it.userCatches" class="mine fl-mono">{{ t('species.season.mine', { n: it.userCatches }, it.userCatches) }}</span>
                </div>
                <div class="bars" role="img" :aria-label="altOf(it)">
                  <span v-for="(v, i) in it.season" :key="i" class="bar" :class="{ now: i + 1 === month }" :style="{ height: `${Math.max(12, Math.round(v * 100))}%` }" />
                </div>
              </div>
              <ChevronRight :size="18" class="text-muted shrink-0" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
      </section>

      <section v-else id="panel-all" role="tabpanel" aria-labelledby="tab-all">
        <div v-if="allLoading && !allItems.length" class="state-center"><div class="m-spinner"></div></div>
        <div v-else-if="allError && !allItems.length" class="empty" role="alert">
          <p class="text-muted text-sm">{{ t('species.season.error') }}</p>
          <button type="button" class="btn btn-secondary mt-2" @click="loadAll">{{ t('species.season.retry') }}</button>
        </div>
        <div v-else class="species-grid">
          <RouterLink v-for="r in allItems" :key="r._id" :to="speciesLink(displayName(r))" class="species-card card">
            <img v-if="r.imageUrl" :src="r.imageUrl" alt="" class="species-thumb" />
            <div v-else class="species-thumb species-thumb-placeholder"><Fish :size="22" /></div>
            <div class="species-card-text">
              <strong>{{ displayName(r) }}</strong>
              <span class="scientific">{{ r.scientificName }}</span>
            </div>
            <ChevronRight :size="18" class="text-muted ml-auto shrink-0" />
          </RouterLink>
        </div>
        <InfiniteSentinel :active="allHasMore && !allError" :loading="allLoading && !!allItems.length" @trigger="loadAll" />
      </section>
    </template>

    <!-- Segnalazione -->
    <div v-if="searching || tab === 'all'" class="report card">
      <strong>{{ t('species.report.title') }}</strong>
      <p class="text-muted text-sm">{{ t('species.report.text') }}</p>
      <p v-if="reported" class="text-sm" role="status">{{ t('species.reported') }}</p>
      <button v-else type="button" class="btn btn-secondary" :disabled="!query.trim() || reporting" @click="report">{{ t('species.notFound.report') }}</button>
    </div>

    <BottomSheet v-model="sheetOpen" :label="t('species.season.pickMonth')">
      <h2 class="sheet-title">{{ t('species.season.pickMonth') }}</h2>
      <div class="month-grid" role="radiogroup" :aria-label="t('species.season.pickMonth')" @keydown="onMonthKey">
        <button
          v-for="m in 12" :key="m" type="button" role="radio" class="month-opt" :aria-checked="m === month"
          :tabindex="m === month ? 0 : -1" :data-month="m" @click="pickMonth(m)"
        >{{ cap(monthName(m)) }}</button>
      </div>
    </BottomSheet>
  </div>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue'
import InfiniteSentinel from '../components/InfiniteSentinel.vue'
import BottomSheet from '../components/motion/BottomSheet.vue'
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish, Search, ChevronRight, ChevronDown, CalendarDays, MapPin, Info, WifiOff } from 'lucide-vue-next'
import { useSpecies } from '../composables/useSpecies.js'
import { useDebouncedFn } from '../composables/useDebouncedFn.js'
import { useWeatherStore } from '../stores/weather.js'
import { useOnline } from '../composables/useOnline.js'
import { getWeatherCache, putWeatherCache } from '../utils/offlineDb.js'
import { monthName, seasonAlt, clockLabel } from '../utils/seasonal.js'

const { t } = useI18n()
const { searchSpecies, reportMissingSpecies, fetchSeasonal, fetchAllSpecies } = useSpecies()
const weather = useWeatherStore()
const online = useOnline()

const speciesLink = (name) => `/species/${encodeURIComponent(name)}`
const displayName = (r) => r.commonNameIt || r.commonNameEn || r.scientificName
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// ── Ricerca ──
const query = ref('')
const results = ref([])
const loading = ref(false)
const searching = computed(() => query.value.trim().length >= 2)

const runSearch = useDebouncedFn(async (q) => {
  loading.value = true
  try { results.value = await searchSpecies(q) } catch { results.value = [] } finally { loading.value = false }
}, 350)
function onInput() {
  const q = query.value.trim()
  if (q.length < 2) { results.value = []; loading.value = false; return }
  loading.value = true
  runSearch(q)
}
function showSeason() { query.value = ''; results.value = []; tab.value = 'season' }

const reporting = ref(false), reported = ref(false)
async function report() {
  reporting.value = true
  try { await reportMissingSpecies(query.value.trim()); reported.value = true } catch { /* il pulsante resta attivo per riprovare */ } finally { reporting.value = false }
}
watch(query, () => { reported.value = false })

// ── Schede ──
const tabs = ['season', 'all']
const tab = ref('season')
function onTabKey(e) {
  const i = tabs.indexOf(tab.value)
  const next = e.key === 'ArrowRight' ? (i + 1) % 2 : e.key === 'ArrowLeft' ? (i + 1) % 2 : e.key === 'Home' ? 0 : e.key === 'End' ? 1 : null
  if (next === null) return
  e.preventDefault(); tab.value = tabs[next]
  nextTick(() => document.getElementById(`tab-${tabs[next]}`)?.focus())
}

// ── «In stagione» ──
const month = ref(new Date().getMonth() + 1)
const monthLabel = computed(() => cap(monthName(month.value)))
const sheetOpen = ref(false)
const seasonItems = ref([])
const zone = ref('italia')
const seasonState = ref('loading') // loading | ok | empty | error
const offlineStamp = ref('')
const geoError = ref(false), locating = ref(false)
const hasPlace = computed(() => weather.hasPlace)
const zoneLabel = computed(() => t(`species.season.zone.${zone.value}`))

const cacheKey = () => weather.place
  ? `seasonal:${Number(weather.place.lat).toFixed(1)},${Number(weather.place.lng).toFixed(1)}:${month.value}`
  : `seasonal:italia:${month.value}`

async function loadSeason() {
  seasonState.value = 'loading'; offlineStamp.value = ''
  const key = cacheKey()
  try {
    const d = await fetchSeasonal({ month: month.value, lat: weather.place?.lat, lng: weather.place?.lng })
    seasonItems.value = d.data || []; zone.value = d.zone || 'italia'
    seasonState.value = seasonItems.value.length ? 'ok' : 'empty'
    putWeatherCache({ key, data: d, savedAt: Date.now() }).catch(() => {})
  } catch (e) {
    let rec = null
    try { rec = await getWeatherCache(key) } catch { /* IndexedDB non disponibile */ }
    if (rec?.data?.data?.length) {
      seasonItems.value = rec.data.data; zone.value = rec.data.zone || 'italia'; seasonState.value = 'ok'
      if (!online.value || !e?.response) offlineStamp.value = clockLabel(rec.savedAt)
    } else seasonState.value = 'error'
  }
}
async function enableLocation() {
  locating.value = true; geoError.value = false
  const ok = await weather.useHere()
  locating.value = false
  if (!ok) { geoError.value = true; return }
  loadSeason()
}
function pickMonth(m) { month.value = m; sheetOpen.value = false; loadSeason() }
function onMonthKey(e) {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (!d) return
  e.preventDefault()
  const m = ((month.value - 1 + d + 12) % 12) + 1
  month.value = m
  nextTick(() => document.querySelector(`.month-opt[data-month="${m}"]`)?.focus())
}
const altOf = (it) => seasonAlt(it.name, it.season, month.value, it.label)

// ── «Tutte» ──
const allItems = ref([]), allPage = ref(0), allHasMore = ref(true), allLoading = ref(false), allError = ref(false)
async function loadAll() {
  if (allLoading.value || !allHasMore.value) return
  allLoading.value = true; allError.value = false
  try {
    const d = await fetchAllSpecies(allPage.value + 1)
    allItems.value.push(...(d.data || [])); allPage.value = d.page; allHasMore.value = !!d.hasMore
  } catch { allError.value = true } finally { allLoading.value = false }
}
watch(tab, (v) => { if (v === 'all' && !allItems.value.length) loadAll() })

onMounted(loadSeason)
</script>

<style scoped>
.search-wrap { @apply relative; }
.search-icon { @apply absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none; }
.search-input { @apply w-full min-h-[48px] rounded-xl pl-10 pr-4; }

.tabs { @apply flex gap-1 p-1 bg-surface-2 border border-border rounded-full mb-4; }
.tab { @apply flex-1 min-h-[44px] rounded-full text-sm font-semibold text-muted border-0 bg-transparent cursor-pointer; transition: background-color var(--motion-fast), color var(--motion-fast); }
.tab[aria-selected='true'] { @apply bg-ocean/15 text-ocean-text; }
.tab:focus-visible, .month-chip:focus-visible, .month-opt:focus-visible { outline: 2px solid var(--ocean); outline-offset: 2px; }

.season-head { @apply flex items-start justify-between gap-3 mb-1; }
.season-title { @apply text-xl text-foam m-0; }
.month-chip { @apply inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full border border-border bg-surface-2 text-sm font-semibold text-foam cursor-pointer shrink-0; }
.indicative { @apply flex items-center gap-1.5 text-xs text-muted mb-3; }
.notice { @apply flex items-center gap-2 text-sm text-muted border border-dashed border-border rounded-xl p-3 mb-3; }

.season-list { @apply list-none p-0 m-0 grid gap-3; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); }
.season-row { @apply flex items-center gap-3 no-underline text-inherit hover:border-ocean; transition: border-color var(--motion-fast); }
.season-row strong { @apply text-base text-foam; }
.season-meta { @apply flex flex-wrap items-center gap-x-3 text-sm mt-1; }
.level { @apply text-ocean-text font-semibold; }
.mine { @apply text-xs text-muted; }
.bars { @apply flex items-end gap-[3px] h-8 mt-2; }
.bar { @apply flex-1 rounded-sm bg-ocean/40; }
.bar.now { background: var(--sand); }

.empty { @apply flex flex-col items-start; }
.species-grid { @apply grid gap-3; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); }
.species-card { @apply flex items-center gap-3 no-underline text-inherit hover:border-ocean transition-colors; }
.species-card-text { @apply flex flex-col min-w-0; }
.species-card-text strong { @apply text-base text-foam; }
.species-thumb { @apply w-12 h-12 rounded-xl object-cover shrink-0; }
.species-thumb-placeholder { @apply flex items-center justify-center border border-ocean text-ocean-text; background: var(--ocean-glow); }
.scientific { @apply block text-xs text-muted italic truncate; }

.report { @apply mt-6 flex flex-col items-start gap-2 border-dashed; }

.sheet-title { @apply text-xl text-foam mb-3; }
.month-grid { @apply grid grid-cols-3 gap-2 pb-4; }
.month-opt { @apply min-h-[48px] rounded-xl border border-border bg-surface-2 text-sm font-semibold text-foam cursor-pointer; }
.month-opt[aria-checked='true'] { @apply border-ocean bg-ocean/15 text-ocean-text; }
</style>

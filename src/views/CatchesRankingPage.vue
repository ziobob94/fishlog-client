<template>
  <div class="ranking">
    <header class="head">
      <button type="button" class="back m-press m-color" :aria-label="t('common.back')" @click="goBack"><ChevronLeft :size="22" /></button>
      <div class="head-text">
        <h1>{{ title }}</h1>
        <p class="text-muted">{{ t('catchesRanking.subtitle') }}</p>
      </div>
      <label class="period">
        <span class="sr-only">{{ t('catchesRanking.period.label') }}</span>
        <select v-model="period" class="period-select m-color">
          <option v-for="p in periodOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </label>
    </header>

    <div v-if="notFound" class="state-center"><p class="text-muted">{{ t('catchesRanking.notFound') }}</p></div>

    <!-- Errore -->
    <section v-else-if="error && !data" class="state-card card state-error" role="alert">
      <AlertTriangle :size="22" />
      <h2>{{ t('catchesRanking.error.title') }}</h2>
      <p>{{ t('catchesRanking.error.text') }}</p>
      <button type="button" class="btn btn-primary w-full m-press" @click="load()"><RefreshCw :size="16" /> {{ t('catchesRanking.error.retry') }}</button>
    </section>

    <!-- Caricamento a scheletri -->
    <div v-else-if="loading && !data" class="skeletons" aria-busy="true">
      <div class="sk sk-card"></div><div class="sk sk-card sk-short"></div>
      <div v-for="n in 6" :key="n" class="sk sk-row"></div>
    </div>

    <template v-else-if="data">
      <!-- Nessuna cattura (nel periodo/profilo) -->
      <section v-if="!data.totals.catches" class="state-card card">
        <Bobber :size="40" />
        <h2>{{ t('catchesRanking.empty.title') }}</h2>
        <p>{{ isSelf ? t('catchesRanking.empty.textMine') : t('catchesRanking.empty.textOther') }}</p>
        <RouterLink v-if="isSelf" to="/new" class="btn btn-primary m-press"><Plus :size="16" /> {{ t('catchesRanking.empty.cta') }}</RouterLink>
      </section>

      <template v-else>
        <!-- Record + totali -->
        <section class="record card">
          <StampBadge v-if="data.record" :title="t('catchesRanking.recordStamp').toUpperCase()" :value="fmtKg(data.record.weightKg)" unit="kg" :size="88" />
          <div v-if="data.record" class="record-text">
            <p class="eyebrow">{{ isSelf ? t('catchesRanking.recordMine') : t('catchesRanking.recordOther') }}</p>
            <RouterLink :to="`/session/${data.record.sessionId}`" class="record-link">
              {{ data.record.species }}<template v-if="data.record.lengthCm"> · <span class="mono">{{ fmtCm(data.record.lengthCm) }} cm</span></template>
            </RouterLink>
            <p class="text-muted text-sm">{{ data.record.location }} · {{ fmtDate(data.record.date) }}</p>
          </div>
        </section>
        <dl class="totals">
          <div><dd class="mono">{{ data.totals.catches }}</dd><dt>{{ t('catchesRanking.totals.catches') }}</dt></div>
          <div><dd class="mono">{{ data.totals.species }}</dd><dt>{{ t('catchesRanking.totals.species') }}</dt></div>
          <div><dd class="mono">{{ fmtKg(data.totals.maxWeightKg) }}<small> kg</small></dd><dt>{{ t('catchesRanking.totals.heaviest') }}</dt></div>
        </dl>

        <!-- Ordinamento -->
        <div class="segmented" role="group" :aria-label="t('catchesRanking.sort.label')">
          <button v-for="s in SORTS" :key="s" type="button" class="seg m-color m-press" :class="{ on: sort === s }" :aria-pressed="sort === s" @click="setSort(s)">
            {{ t(`catchesRanking.sort.${s}`) }}
          </button>
        </div>

        <!-- Chip per specie -->
        <div v-if="sort !== 'species'" class="chips" role="group" :aria-label="t('catchesRanking.speciesFilter')">
          <button type="button" class="chip m-color m-press" :class="{ on: !species }" :aria-pressed="!species" @click="setSpecies('')">{{ t('catchesRanking.allSpecies') }}</button>
          <button v-for="s in data.species" :key="s.species" type="button" class="chip m-color m-press" :class="{ on: sameSpecies(s.species) }" :aria-pressed="sameSpecies(s.species)" @click="setSpecies(s.species)">{{ s.species }}</button>
        </div>

        <!-- Per specie -->
        <ol v-if="sort === 'species'" class="list">
          <li v-for="(s, i) in data.data" :key="s.species">
            <button type="button" class="row row-btn m-color m-press" @click="pickSpecies(s.species)">
              <span class="pos mono">{{ i + 1 }}</span>
              <span class="thumb"><Fish :size="20" /></span>
              <span class="info"><strong>{{ s.species }}</strong><small class="text-muted">{{ t('catchesRanking.catchesCount', { n: s.count }, s.count) }}</small></span>
              <span class="vals"><small class="text-muted">{{ t('catchesRanking.record') }}</small>
                <span class="mono big">{{ fmtKg(s.recordWeightKg) }} <small>kg</small> · {{ fmtCm(s.recordLengthCm) }} <small>cm</small></span></span>
            </button>
          </li>
          <p class="hint text-muted">{{ t('catchesRanking.speciesHint') }}</p>
        </ol>

        <!-- Per peso / lunghezza -->
        <template v-else>
          <p v-if="!rows.length" class="hint text-muted">{{ t('catchesRanking.empty.textOther') }}</p>
          <ol v-else class="list">
            <li v-for="(c, i) in rows" :key="c.catchId">
              <RouterLink :to="`/session/${c.sessionId}`" class="row m-color m-press" :aria-label="t('catchesRanking.openCatch', { species: c.species, pos: i + 1 })">
                <span class="pos mono" :class="{ first: i === 0 }">{{ i + 1 }}</span>
                <img v-if="c.photoUrl" :src="c.photoUrl" alt="" class="thumb" loading="lazy" />
                <span v-else class="thumb"><Fish :size="20" /></span>
                <span class="info"><strong>{{ c.species }}</strong><small class="text-muted">{{ c.location }}<template v-if="c.location"> · </template>{{ fmtDate(c.date) }}</small></span>
                <span class="vals">
                  <span class="mono big">{{ sort === 'length' ? fmtCm(c.lengthCm) : fmtKg(c.weightKg) }} <small>{{ sort === 'length' ? 'cm' : 'kg' }}</small></span>
                  <span class="mono small text-muted">{{ sort === 'length' ? fmtKg(c.weightKg) + ' kg' : fmtCm(c.lengthCm) + ' cm' }}</span>
                </span>
              </RouterLink>
            </li>
          </ol>
          <div v-if="data.hasMore || loadingMore" class="more">
            <button type="button" class="btn btn-ghost w-full m-press" :disabled="loadingMore" @click="loadMore">{{ t('catchesRanking.showMore') }}</button>
            <p class="text-muted text-sm">{{ t('catchesRanking.shown', { shown: items.length, total: data.total }) }}</p>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, AlertTriangle, RefreshCw, Plus, Fish } from 'lucide-vue-next'
import { useUserStore } from '../stores/users.js'
import { useAuthStore } from '../stores/auth.js'
import StampBadge from '../components/StampBadge.vue'
import Bobber from '../components/Bobber.vue'
import { SORTS, rankCatches, normSpecies, fmtKg, fmtCm } from '../utils/catchesRanking.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const auth = useAuthStore()

const data = ref(null)
const items = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref(false)
const notFound = ref(false)
const sort = ref('weight')
const species = ref('')
const period = ref('all')
let seq = 0

const userId = computed(() => String(route.params.id))
const isSelf = computed(() => userId.value === auth.user?._id)
const title = computed(() => isSelf.value
  ? t('catchesRanking.titleMine')
  : t('catchesRanking.titleOther', { name: data.value?.user?.displayName || '' }))
const year = new Date().getFullYear()
const periodOptions = computed(() => [
  { value: 'all', label: t('catchesRanking.period.all') },
  { value: String(year), label: t('catchesRanking.period.year', { year }) },
  { value: '30d', label: t('catchesRanking.period.30d') }
])

// Il server ordina e filtra; qui si riapplica la stessa logica alle righe già caricate
// così il cambio peso/lunghezza o specie è immediato mentre arriva la risposta.
const rows = computed(() => rankCatches(items.value, { sort: sort.value, species: species.value }))

const sameSpecies = s => normSpecies(s) === normSpecies(species.value)
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

function params(page = 1) {
  return { sort: sort.value, period: period.value, page, species: species.value || undefined }
}

async function load() {
  const mine = ++seq
  loading.value = true; error.value = false; notFound.value = false
  try {
    const res = await userStore.fetchUserCatches(userId.value, params())
    if (mine !== seq) return
    data.value = res
    items.value = sort.value === 'species' ? [] : res.data
  } catch (e) {
    if (mine !== seq) return
    if (e.response?.status === 404) notFound.value = true
    else { error.value = true; data.value = null }
  } finally {
    if (mine === seq) loading.value = false
  }
}

async function loadMore() {
  const mine = seq
  loadingMore.value = true
  try {
    const res = await userStore.fetchUserCatches(userId.value, params(data.value.page + 1))
    if (mine !== seq) return
    const seen = new Set(items.value.map(c => c.catchId))
    items.value = [...items.value, ...res.data.filter(c => !seen.has(c.catchId))]
    data.value = { ...data.value, page: res.page, hasMore: res.hasMore, total: res.total }
  } catch { /* resta la lista già caricata: si può ritentare */ } finally { loadingMore.value = false }
}

function setSort(s) { if (sort.value !== s) { sort.value = s; if (s === 'species') species.value = ''; load() } }
function setSpecies(s) { species.value = s; load() }
function pickSpecies(s) { sort.value = 'weight'; species.value = s; load() }
function goBack() { window.history.length > 1 ? router.back() : router.push(isSelf.value ? '/board' : `/users/${userId.value}`) }

watch(period, () => load())
watch(userId, () => { data.value = null; species.value = ''; load() })
onMounted(load)
</script>

<style scoped>
.ranking { @apply max-w-lg mx-auto; }
h1, h2 { font-family: var(--font-display); font-weight: 700; }
.mono { font-family: var(--font-mono); }
.head { @apply flex items-center gap-2 mb-4; }
.head-text { @apply flex-1 min-w-0; }
.head-text h1 { @apply text-xl leading-tight; }
.head-text p { @apply text-xs; }
.back { @apply flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-foam; min-width: 44px; min-height: 44px; }
.period-select { @apply bg-surface-2 text-foam border border-border rounded-lg px-2 text-sm cursor-pointer; min-height: 44px; max-width: 120px; }
:is(.back, .period-select, .seg, .chip, .row, .row-btn):focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }

.record { @apply flex items-center gap-4 mb-3; border-radius: 24px 24px 24px 8px; }
.eyebrow { @apply text-xs font-bold tracking-widest uppercase; color: rgb(var(--color-ocean-text)); }
.record-link { @apply font-bold text-lg no-underline text-foam; }
.totals { @apply grid grid-cols-3 gap-2 mb-4 text-center bg-surface border border-border/60 rounded-lg py-3; }
.totals dd { @apply text-xl font-bold m-0; }
.totals dd small { @apply text-xs font-normal text-muted; }
.totals dt { @apply text-xs text-muted; }

.segmented { @apply flex gap-1 p-1 mb-3 rounded-lg bg-surface border border-border/60; }
.seg { @apply flex-1 text-sm font-semibold rounded-md bg-transparent border-none text-muted cursor-pointer; min-height: 44px; }
.seg.on { background: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); }
.chips { @apply flex gap-2 overflow-x-auto mb-3 pb-1; }
.chip { @apply shrink-0 px-3 rounded-full text-sm font-semibold bg-surface-2 border border-border text-foam cursor-pointer; min-height: 44px; }
.chip.on { background: rgb(var(--color-ocean)); border-color: transparent; color: rgb(var(--color-on-primary)); }

.list { @apply list-none p-0 m-0; }
.row { @apply flex items-center gap-3 py-2.5 no-underline text-foam border-0 border-b border-solid border-border/50 w-full bg-transparent text-left; min-height: 56px; }
.row-btn { @apply cursor-pointer; font: inherit; }
.row:active { background: var(--ocean-glow); }
.pos { @apply flex items-center justify-center rounded-md text-sm font-bold bg-surface-2 shrink-0; width: 28px; height: 28px; }
.pos.first { background: rgb(var(--color-sand)); color: rgb(var(--color-on-primary)); }
.thumb { @apply flex items-center justify-center rounded-lg bg-surface-2 text-ocean object-cover shrink-0; width: 44px; height: 44px; }
.info { @apply flex flex-col flex-1 min-w-0; }
.info small { @apply truncate; }
.vals { @apply flex flex-col items-end shrink-0; }
.big { @apply font-bold; }
.big small, .small { @apply text-xs; }
.hint { @apply text-xs mt-3; }
.more { @apply mt-3 text-center; }

.state-card { @apply flex flex-col items-center text-center gap-2; }
.state-error { border-color: rgb(var(--color-danger) / .5); }
.state-error svg { color: rgb(var(--color-danger-text)); }

.sk { @apply rounded-lg bg-surface-2; animation: sk var(--motion-loop-skeleton) ease-in-out infinite; }
.sk-card { height: 84px; margin-bottom: 12px; }
.sk-short { height: 56px; }
.sk-row { height: 52px; margin-bottom: 10px; }
@keyframes sk { 50% { opacity: .5 } }
@media (prefers-reduced-motion: reduce) { .sk { animation: none; } }
</style>

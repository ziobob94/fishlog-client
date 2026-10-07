<template>
  <div class="home">
    <!-- Hero: una promessa chiara e due azioni, prima di tutto il resto. -->
    <section class="hero">
      <p class="eyebrow">{{ t('home.hero.eyebrow') }}</p>
      <h1>{{ t('home.hero.title') }}</h1>
      <p class="hero-sub">{{ t('home.hero.subtitle') }}</p>
      <div class="hero-actions">
        <RouterLink to="/new" class="btn btn-primary">{{ t('home.newSession') }}</RouterLink>
        <RouterLink to="/species" class="btn btn-secondary">{{ t('home.hero.searchSpecies') }}</RouterLink>
      </div>
    </section>

    <!-- Selettore zona: la barra "Oggi in mare" sotto segue la zona scelta. -->
    <section class="zones" :aria-label="t('home.zones.title')">
      <h2 class="section-label">{{ t('home.zones.title') }}</h2>
      <div class="zone-list">
        <button
          v-for="z in zones"
          :key="z.key"
          type="button"
          class="zone-chip"
          :class="{ 'zone-chip-active': selectedZone === z.key }"
          @click="selectZone(z.key)"
        >
          <component :is="z.key === 'here' ? MapPin : Waves" :size="15" />
          {{ t(`home.zones.items.${z.key}`) }}
        </button>
      </div>
    </section>

    <!-- Barra "Oggi in mare": condizioni live della zona scelta. -->
    <section class="sea-bar">
      <div class="sea-bar-head">
        <span class="eyebrow icon-inline"><Waves :size="14" /> {{ t('home.sea.title') }}</span>
        <span v-if="updatedAt" class="text-muted text-xs">{{ t('home.sea.updated', { time: updatedAt }) }}</span>
      </div>

      <div v-if="conditions" class="live-tiles">
        <div v-for="tile in tiles" :key="tile.key" class="live-tile">
          <component :is="tile.icon" :size="16" class="live-tile-icon" />
          <span class="live-tile-value">{{ tile.value }}<small>{{ tile.unit }}</small></span>
          <span class="live-tile-label">{{ t(`home.liveConditions.labels.${tile.key}`) }}</span>
        </div>
      </div>
      <div v-else-if="loadingConditions" class="live-empty icon-inline text-muted text-xs">
        <div class="spinner"></div> {{ t('home.liveConditions.loading') }}
      </div>
      <div v-else class="live-empty">
        <p class="text-muted text-sm">{{ selectedZone === 'here' ? t('home.liveConditions.enable') : t('home.sea.unavailable') }}</p>
        <button v-if="selectedZone === 'here'" class="btn btn-secondary btn-sm" @click="loadZone('here')">{{ t('home.liveConditions.enableCta') }}</button>
      </div>

      <p class="live-disclaimer">{{ t('home.liveConditions.disclaimer') }}</p>
    </section>

    <!-- Sezioni narrative: ognuna spiega un valore e porta all'azione. -->
    <section class="story-grid">
      <article v-for="s in stories" :key="s.key" class="story">
        <div class="story-icon"><component :is="s.icon" :size="22" /></div>
        <h2>{{ t(`home.stories.${s.key}.title`) }}</h2>
        <p class="text-muted">{{ t(`home.stories.${s.key}.text`) }}</p>
        <RouterLink :to="s.to" class="story-cta">{{ t(`home.stories.${s.key}.cta`) }} <ArrowRight :size="14" /></RouterLink>
      </article>
    </section>

    <!-- Accessi secondari, in piccolo: il resto è nel menu. -->
    <nav class="quick-links" :aria-label="t('home.quick.title')">
      <RouterLink v-for="q in quickLinks" :key="q.to" :to="q.to" class="quick-link">
        <component :is="q.icon" :size="14" /> {{ t(`home.quick.${q.key}`) }}
        <span v-if="badgeCount(q.key)" class="badge badge-danger">{{ badgeCount(q.key) }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Fish, Users, ShoppingBag, UserCircle, UserPlus, BarChart3,
  Waves, Thermometer, Wind, Gauge, Droplet, Trophy, MapPin,
  CalendarDays, ArrowRight
} from 'lucide-vue-next'
import { useFriendStore } from '../stores/friends.js'
import { useLiveConditions } from '../composables/useLiveConditions.js'

const { t } = useI18n()
const friends = useFriendStore()
const { fetchLiveConditions } = useLiveConditions()

const conditions = ref(null)
const loadingConditions = ref(false)
const updatedAt = ref('')
const selectedZone = ref('here')

// Punti in mare aperto rappresentativi di ogni zona, per le condizioni.
const zones = [
  { key: 'here' },
  { key: 'adriatic', lat: 43.6, lng: 14.0 },
  { key: 'tyrrhenian', lat: 40.0, lng: 12.3 },
  { key: 'ligurian', lat: 43.7, lng: 8.6 },
  { key: 'ionian', lat: 38.3, lng: 17.3 },
  { key: 'sicily', lat: 37.2, lng: 12.2 }
]

function nowLabel() {
  return new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

async function loadCoords(lat, lng) {
  conditions.value = await fetchLiveConditions(lat, lng)
  updatedAt.value = conditions.value ? nowLabel() : ''
  loadingConditions.value = false
}

function loadZone(key) {
  conditions.value = null
  updatedAt.value = ''
  if (key === 'here') {
    if (!navigator.geolocation) return
    loadingConditions.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => loadCoords(pos.coords.latitude, pos.coords.longitude),
      () => { loadingConditions.value = false },
      { timeout: 8000 }
    )
    return
  }
  const z = zones.find(x => x.key === key)
  loadingConditions.value = true
  loadCoords(z.lat, z.lng)
}

function selectZone(key) {
  selectedZone.value = key
  loadZone(key)
}

// Badge numerico per box con contatori "da leggere/gestire" (gruppi: in sospeso).
function badgeCount(key) {
  if (key === 'friends') return friends.pendingCount
  return 0
}

const stories = [
  { key: 'community', to: '/feed',    icon: Users },
  { key: 'market',    to: '/market',  icon: ShoppingBag },
  { key: 'species',   to: '/species', icon: CalendarDays }
]

const quickLinks = [
  { key: 'sessions',    to: '/sessions',   icon: Fish },
  { key: 'stats',       to: '/stats',      icon: BarChart3 },
  { key: 'leaderboard', to: '/classifica', icon: Trophy },
  { key: 'friends',     to: '/friends',    icon: UserPlus },
  { key: 'profile',     to: '/profile',    icon: UserCircle }
]

// Solo i valori disponibili: fuori mare onda e temperatura acqua mancano e
// la tile semplicemente non compare.
const tiles = computed(() => {
  const c = conditions.value
  if (!c) return []
  return [
    c.windSpeed != null && { key: 'wind', icon: Wind, value: Math.round(c.windSpeed), unit: ` km/h ${c.windDirection ?? ''}` },
    c.waveHeight != null && { key: 'wave', icon: Waves, value: c.waveHeight, unit: ' m' },
    c.waterTemp != null && { key: 'water', icon: Droplet, value: c.waterTemp, unit: '°C' },
    c.tempAir != null && { key: 'air', icon: Thermometer, value: c.tempAir, unit: '°C' },
    c.pressure != null && { key: 'pressure', icon: Gauge, value: Math.round(c.pressure), unit: ' hPa' }
  ].filter(Boolean)
})

onMounted(() => { loadZone('here') })
</script>

<style scoped>
.icon-inline { @apply inline-flex items-center gap-1.5; }
.eyebrow { @apply text-xs font-bold uppercase tracking-widest text-ocean; }
.section-label { @apply text-xs font-bold uppercase tracking-widest text-muted mb-2; font-size: 0.72rem; }

.hero {
  @apply rounded-lg border border-border/60 px-5 py-8 mb-5 text-center;
  background: linear-gradient(160deg, var(--ocean-glow), transparent 75%), rgb(var(--color-surface));
}
.hero h1 { @apply mt-1; }
.hero-sub { @apply text-muted text-sm max-w-xl mx-auto mt-2; }
.hero-actions { @apply flex flex-wrap justify-center gap-2 mt-4; }

.zones { @apply mb-4; }
.zone-list { @apply flex flex-wrap gap-2; }
.zone-chip {
  @apply inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5
         text-sm font-semibold text-foam cursor-pointer transition-all duration-200;
}
.zone-chip:hover { @apply border-ocean; }
.zone-chip-active { @apply bg-ocean border-ocean text-white; }

.sea-bar { @apply rounded-lg border border-border/60 bg-surface p-4 mb-6; }
.sea-bar-head { @apply flex flex-wrap items-center justify-between gap-1 mb-3; }

.live-tiles { @apply grid gap-2; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.live-tile { @apply flex flex-col gap-0.5 rounded-sm bg-surface-2 border border-border/50 px-3 py-2; }
.live-tile-icon { @apply text-ocean; }
.live-tile-value { @apply text-xl font-extrabold text-foam leading-none mt-1; }
.live-tile-value small { @apply text-xs font-semibold text-muted; }
.live-tile-label { @apply text-[0.68rem] font-semibold uppercase tracking-wide text-muted; }
.live-empty { @apply flex flex-wrap items-center justify-between gap-2 py-2; }
.live-disclaimer { @apply text-[0.7rem] text-muted mt-3; }

.story-grid { @apply grid gap-4 mb-8; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.story { @apply flex flex-col items-start gap-2 rounded-lg border border-border/60 bg-surface p-5; }
.story-icon {
  @apply flex items-center justify-center w-11 h-11 rounded-full text-ocean;
  background: var(--ocean-glow);
}
.story h2 { @apply text-lg; }
.story p { @apply text-sm flex-1; }
.story-cta { @apply inline-flex items-center gap-1 text-sm font-semibold text-ocean; }

.quick-links { @apply flex flex-wrap gap-2; }
.quick-link {
  @apply inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface px-3 py-1.5
         text-xs font-semibold text-muted no-underline transition-colors duration-200;
}
.quick-link:hover { @apply border-ocean text-foam; }
</style>

<template>
  <div class="home">
    <!-- Hero "Oggi dove sei": risponde a "conviene uscire oggi?" prima di tutto.
         Valori grandi e leggibili a colpo d'occhio, con avviso onesto sul fatto
         che i dati sono indicativi. Se la posizione non è disponibile, invita
         ad attivarla invece di sparire. -->
    <section class="live-hero">
      <div class="live-hero-head">
        <div>
          <p class="eyebrow icon-inline"><Waves :size="14" /> {{ t('home.liveConditions.title') }}</p>
          <p class="text-muted text-xs">{{ t('home.liveConditions.subtitle') }}</p>
        </div>
        <RouterLink to="/new" class="btn btn-primary btn-sm">{{ t('home.newSession') }}</RouterLink>
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
        <p class="text-muted text-sm">{{ t('home.liveConditions.enable') }}</p>
        <button class="btn btn-secondary btn-sm" @click="loadLiveConditions">{{ t('home.liveConditions.enableCta') }}</button>
      </div>

      <p class="live-disclaimer">{{ t('home.liveConditions.disclaimer') }}</p>
    </section>

    <section v-for="group in groups" :key="group.key" class="hub-group">
      <h2 class="hub-group-title">{{ t(`home.hub.groups.${group.key}`) }}</h2>
      <div class="hub-grid">
        <component
          :is="section.to ? 'RouterLink' : 'div'"
          v-for="section in group.sections"
          :key="section.key"
          :to="section.to"
          class="hub-card"
          :class="{ 'hub-card-disabled': !section.to }"
        >
          <div class="hub-icon"><component :is="section.icon" :size="22" /></div>
          <div class="hub-body">
            <h3>{{ t(`home.hub.sections.${section.key}.title`) }}</h3>
            <p class="text-muted">{{ t(`home.hub.sections.${section.key}.text`) }}</p>
          </div>
          <span v-if="!section.to" class="badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
          <span v-else-if="badgeCount(section.key)" class="badge badge-danger">{{ badgeCount(section.key) }}</span>
        </component>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Fish, Users, Newspaper, Pin, ShoppingBag, MessageSquare,
  BookOpen, MessagesSquare, UserCircle, UserPlus, BarChart3,
  Waves, Thermometer, Wind, Gauge, Droplet, Trophy
} from 'lucide-vue-next'
import { useFriendStore } from '../stores/friends.js'
import { useLiveConditions } from '../composables/useLiveConditions.js'

const { t } = useI18n()
const friends = useFriendStore()
const { fetchLiveConditions } = useLiveConditions()

const conditions = ref(null)
const loadingConditions = ref(false)

function loadLiveConditions() {
  if (!navigator.geolocation) return
  loadingConditions.value = true
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      conditions.value = await fetchLiveConditions(pos.coords.latitude, pos.coords.longitude)
      loadingConditions.value = false
    },
    () => { loadingConditions.value = false },
    { timeout: 8000 }
  )
}

// Badge numerico per box con contatori "da leggere/gestire" (gruppi: in sospeso).
function badgeCount(key) {
  if (key === 'friends') return friends.pendingCount
  return 0
}

const groups = [
  { key: 'diary', sections: [
    { key: 'sessions',    to: '/sessions', icon: Fish },
    { key: 'stats',       to: '/stats',    icon: BarChart3 },
    { key: 'species',     to: '/species',  icon: Fish },
    { key: 'leaderboard', to: '/classifica', icon: Trophy }
  ] },
  { key: 'community', sections: [
    { key: 'feed',    to: '/feed',    icon: Newspaper },
    { key: 'board',   to: '/board',   icon: Pin },
    { key: 'groups',  to: '/groups',  icon: Users },
    { key: 'friends', to: '/friends', icon: UserPlus },
    { key: 'chat',    to: '/chat',    icon: MessagesSquare },
    { key: 'forum',   to: null,       icon: MessageSquare }
  ] },
  { key: 'more', sections: [
    { key: 'marketplace', to: '/market',  icon: ShoppingBag },
    { key: 'culture',     to: null,       icon: BookOpen },
    { key: 'profile',     to: '/profile', icon: UserCircle }
  ] }
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

onMounted(() => { loadLiveConditions() })
</script>

<style scoped>
.icon-inline { @apply inline-flex items-center gap-1.5; }

.eyebrow { @apply text-xs font-bold uppercase tracking-widest text-ocean; }

.live-hero {
  @apply rounded-lg border border-border/60 p-4 mb-6;
  background: linear-gradient(135deg, var(--ocean-glow), transparent 70%), rgb(var(--color-surface));
}
.live-hero-head { @apply flex items-start justify-between gap-3 mb-3; }

.live-tiles { @apply grid gap-2; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.live-tile {
  @apply flex flex-col gap-0.5 rounded-sm bg-ink/40 border border-border/50 px-3 py-2;
}
.live-tile-icon { @apply text-ocean; }
.live-tile-value { @apply text-xl font-extrabold text-foam leading-none mt-1; }
.live-tile-value small { @apply text-xs font-semibold text-muted; }
.live-tile-label { @apply text-[0.68rem] font-semibold uppercase tracking-wide text-muted; }

.live-empty { @apply flex flex-wrap items-center justify-between gap-2 py-2; }
.live-disclaimer { @apply text-[0.7rem] text-muted mt-3; }

.hub-group { @apply mb-6; }
.hub-group-title { @apply text-xs font-bold uppercase tracking-widest text-muted mb-2; font-size: 0.72rem; }

.hub-grid { @apply grid gap-3; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }

.hub-card {
  @apply flex items-start gap-3 relative no-underline text-inherit transition-all duration-200
         bg-surface border border-border/60 rounded-lg p-3.5;
}
a.hub-card:hover { @apply border-ocean; transform: translateY(-2px); }
.hub-card-disabled { @apply opacity-60; }

.hub-icon {
  @apply flex items-center justify-center shrink-0 w-10 h-10 rounded-sm text-ocean;
  background: var(--ocean-glow);
}
.hub-body h3 { @apply font-semibold text-base; }
.hub-body p  { @apply text-xs mt-0.5; }

.hub-card .badge { @apply absolute top-3 right-3; }
</style>

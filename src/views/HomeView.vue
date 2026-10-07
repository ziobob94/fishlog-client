<template>
  <div>
    <!-- Condizioni live sulla posizione attuale, non sul form di log: qui
         risponde a "conviene uscire oggi?", prima ancora di aprire una
         sessione. Silenzioso se la geolocalizzazione non è concessa. -->
    <div v-if="conditions" class="live-card card">
      <div class="live-card-header">
        <span class="icon-inline text-sm font-semibold text-ocean"><Waves :size="16" /> {{ t('home.liveConditions.title') }}</span>
        <span class="text-muted text-xs">{{ t('home.liveConditions.subtitle') }}</span>
      </div>
      <div class="live-card-grid">
        <span v-if="conditions.tempAir != null" class="live-stat icon-inline"><Thermometer :size="14" /> {{ conditions.tempAir }}°C</span>
        <span v-if="conditions.windSpeed != null" class="live-stat icon-inline"><Wind :size="14" /> {{ conditions.windSpeed }} km/h {{ conditions.windDirection }}</span>
        <span v-if="conditions.pressure != null" class="live-stat icon-inline"><Gauge :size="14" /> {{ Math.round(conditions.pressure) }} hPa</span>
        <span v-if="conditions.waveHeight != null" class="live-stat icon-inline"><Waves :size="14" /> {{ conditions.waveHeight }} m</span>
        <span v-if="conditions.waterTemp != null" class="live-stat icon-inline"><Droplet :size="14" /> {{ conditions.waterTemp }}°C</span>
      </div>
    </div>
    <div v-else-if="loadingConditions" class="live-card card live-card-loading icon-inline text-muted text-xs">
      <div class="spinner"></div> {{ t('home.liveConditions.loading') }}
    </div>

    <div class="hub-grid">
      <component
        :is="section.to ? 'RouterLink' : 'div'"
        v-for="section in sections"
        :key="section.key"
        :to="section.to"
        class="hub-card card"
        :class="{ 'hub-card-disabled': !section.to }"
      >
        <div class="hub-icon"><component :is="section.icon" :size="28" /></div>
        <div class="hub-body">
          <h3>{{ t(`home.hub.sections.${section.key}.title`) }}</h3>
          <p class="text-muted">{{ t(`home.hub.sections.${section.key}.text`) }}</p>
        </div>
        <span v-if="!section.to" class="badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
        <span v-else-if="badgeCount(section.key)" class="badge badge-danger">{{ badgeCount(section.key) }}</span>
      </component>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Fish, Users, Newspaper, Pin, ShoppingBag, MessageSquare,
  BookOpen, MessagesSquare, UserCircle, UserPlus, BarChart3,
  Waves, Thermometer, Wind, Gauge, Droplet
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

const sections = [
  { key: 'sessions',    to: '/sessions', icon: Fish },
  { key: 'feed',        to: '/feed',     icon: Newspaper },
  { key: 'board',       to: '/board',    icon: Pin },
  { key: 'groups',      to: '/groups',   icon: Users },
  { key: 'friends',     to: '/friends',  icon: UserPlus },
  { key: 'profile',     to: '/profile',  icon: UserCircle },
  { key: 'stats',       to: '/stats',    icon: BarChart3 },
  { key: 'marketplace', to: '/market',   icon: ShoppingBag },
  { key: 'forum',       to: null,        icon: MessageSquare },
  { key: 'culture',     to: null,        icon: BookOpen },
  { key: 'chat',        to: '/chat',     icon: MessagesSquare }
]

onMounted(() => { loadLiveConditions() })
</script>

<style scoped>
.icon-inline {
  @apply inline-flex items-center gap-1.5;
}

.live-card {
  @apply py-3 mb-4;
}

.live-card-loading {
  @apply flex-row items-center;
}

.live-card-header {
  @apply flex flex-wrap items-center justify-between gap-1 mb-2;
}

.live-card-grid {
  @apply flex flex-wrap gap-x-4 gap-y-1.5;
}

.live-stat {
  @apply text-sm text-foam;
}

.hub-grid  { @apply grid gap-4; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }

.hub-card {
  @apply flex flex-col gap-2 relative no-underline text-inherit transition-all duration-200;
}
a.hub-card:hover { @apply border-ocean; transform: translateY(-2px); }

.hub-card-disabled { @apply opacity-60; }

.hub-icon { @apply text-ocean; }
.hub-body h3 { @apply font-semibold; }
.hub-body p  { @apply text-sm mt-0.5; }

.hub-card .badge { @apply absolute top-3 right-3; }
</style>

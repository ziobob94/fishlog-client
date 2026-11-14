<template>
  <div class="home">
    <!-- Meteo in evidenza: scheda grande. -->
    <HomeWeatherCard class="mb-4" />

    <!-- Attività dei pesci (stima indicativa) del luogo mostrato nella card meteo. -->
    <FishActivityCard />

    <!-- Le mie località: fila di schede meteo/mare dei posti preferiti. -->
    <FavoritePlaces />

    <!-- Uscita in corso (mobile): riprendi con un tocco. -->
    <RouterLink v-if="sessions.ongoing" :to="{ path: `/session/${sessions.ongoing._id}/edit`, hash: '#section-catches' }" class="ongoing-panel md:hidden">
      <span class="pulse-dot"></span>
      <span class="ongoing-text">
        <span class="ongoing-eyebrow">{{ t('home.ongoingTitle') }}</span>
        <span class="ongoing-name">{{ sessions.ongoing.title || sessions.ongoing.location?.name || t('session.untitled') }}</span>
      </span>
      <span class="btn-sand">{{ t('sessions.resume') }}</span>
    </RouterLink>

    <GlobeCard />

    <!-- Seconda fonte per vento e mare: solo un link esterno. -->

    <!-- Due scorciatoie (mobile). -->
    <div class="tiles-2 md:hidden">
      <RouterLink to="/species" class="tile"><AppIcon name="uscite" :size="20" class="tile-icon" /> {{ t('home.tiles.species') }}</RouterLink>
      <RouterLink to="/stats" class="tile"><BarChart3 :size="20" class="tile-icon" /> {{ t('home.tiles.stats') }}</RouterLink>
    </div>

    <!-- Sezioni narrative: ognuna spiega un valore e porta all'azione. -->
    <section class="story-grid max-md:hidden">
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
import { useI18n } from 'vue-i18n'
import {
  Fish, Users, ShoppingBag, UserCircle, UserPlus, BarChart3,
  Trophy, CalendarDays, ArrowRight, CloudSun, Flag
} from 'lucide-vue-next'
import AppIcon from '../components/AppIcon.vue'
import { useSessionStore } from '../stores/sessions.js'
import GlobeCard from '../components/GlobeCard.vue'
import { useFriendStore } from '../stores/friends.js'
import HomeWeatherCard from '../components/weather/HomeWeatherCard.vue'
import FavoritePlaces from '../components/favorites/FavoritePlaces.vue'
import FishActivityCard from '../components/fishing/FishActivityCard.vue'

const { t } = useI18n()
const friends = useFriendStore()
const sessions = useSessionStore()

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
  { key: 'weather',     to: '/meteo',      icon: CloudSun },
  { key: 'sessions',    to: '/sessions',   icon: Fish },
  { key: 'stats',       to: '/stats',      icon: BarChart3 },
  { key: 'leaderboard', to: '/classifica', icon: Trophy },
  { key: 'gare',        to: '/gare',       icon: Flag },
  { key: 'friends',     to: '/friends',    icon: UserPlus },
  { key: 'profile',     to: '/board',    icon: UserCircle }
]
</script>

<style scoped>
/* Spazio in fondo: il pulsante di Fishy (56 px fisso a 16 px sopra la tab bar) non copre l'ultimo contenuto. */
@media (max-width: 767px) { .home { padding-bottom: calc(56px + 16px + var(--bottom-nav-h) + env(safe-area-inset-bottom)); } }
.icon-inline { @apply inline-flex items-center gap-1.5; }

.story-grid { @apply grid gap-4 mb-8; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.story { @apply flex flex-col items-start gap-2 rounded-signature border border-border/60 bg-surface p-5; }
.story-icon {
  @apply flex items-center justify-center w-11 h-11 rounded-full text-ocean-text;
  background: var(--ocean-glow);
}
.story h2 { @apply text-lg; }
.story p { @apply text-sm flex-1; }
.story-cta { @apply inline-flex items-center gap-1 text-sm font-semibold text-ocean-text; }

.tiles-2 { @apply grid grid-cols-2 gap-3 mb-5; }
.tile { @apply flex flex-col gap-2 p-4 min-h-[88px] rounded-xl border border-border bg-surface text-foam font-bold no-underline; }
.tile-icon { @apply text-ocean-text; }
.ongoing-panel {
  @apply flex items-center gap-3 p-4 mb-4 rounded-xl border border-sand no-underline text-foam;
  background: rgb(var(--color-sand) / 0.1);
}
.ongoing-text { @apply flex flex-col min-w-0 flex-1; }
.ongoing-eyebrow { @apply text-xs font-bold uppercase text-sand-text; letter-spacing: 0.08em; }
.ongoing-name { @apply font-bold truncate; }
.btn-sand { @apply inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-sand text-on-primary font-bold shrink-0; }
.pulse-dot { @apply inline-flex h-3 w-3 rounded-full bg-sand shrink-0; }
.quick-links { @apply flex flex-wrap gap-2; }
.quick-link {
  @apply inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface px-4 min-h-[44px]
         text-xs font-semibold text-muted no-underline transition-colors duration-200;
}
.quick-link:hover { @apply border-ocean text-foam; }
</style>

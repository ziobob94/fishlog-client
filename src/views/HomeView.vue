<template>
  <div class="home">
    <!-- Uscita in corso: in cima, solo se attiva. Riprendi con un tocco. -->
    <RouterLink v-if="sessions.ongoing" :to="{ path: `/session/${sessions.ongoing._id}/edit`, hash: '#section-catches' }" class="ongoing-panel">
      <span class="pulse-dot" aria-hidden="true"></span>
      <span class="ongoing-text">
        <span class="ongoing-eyebrow">{{ t('home.ongoingTitle') }}</span>
        <span class="ongoing-name">{{ sessions.ongoing.title || sessions.ongoing.location?.name || t('session.untitled') }}</span>
      </span>
      <span class="btn-sand">{{ t('sessions.resume') }}</span>
    </RouterLink>

    <!-- Mobile: una colonna. Desktop: a sinistra «adesso» e le località, a destra le pescate. -->
    <div class="home-grid">
      <div class="home-col">
        <HomeNowCard />
        <FavoritePlaces />
      </div>
      <div class="home-col">
        <!-- Accordion «Le tue pescate» (mappamondo): chiuso o aperto, ricorda la scelta -->
        <GlobeCard />
      </div>
    </div>

    <!-- Una sola riga di scorciatoie: il resto è nel menu. -->
    <nav class="shortcuts" :aria-label="t('home.quick.title')">
      <RouterLink v-for="q in shortcuts" :key="q.to" :to="q.to" class="shortcut m-press" :aria-label="q.key === 'friends' && pending ? t('home.quick.friendsRequests', { n: pending }) : undefined">
        <component :is="q.icon" :size="20" aria-hidden="true" />
        <span class="shortcut-t">{{ t(`home.quick.${q.key}`) }}</span>
        <span v-if="q.key === 'friends' && pending" class="badge badge-danger" aria-hidden="true">{{ pending }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BookOpen, BarChart3, Trophy, Flag, UserPlus } from 'lucide-vue-next'
import { useSessionStore } from '../stores/sessions.js'
import { useFriendStore } from '../stores/friends.js'
import HomeNowCard from '../components/HomeNowCard.vue'
import GlobeCard from '../components/GlobeCard.vue'
import FavoritePlaces from '../components/favorites/FavoritePlaces.vue'

const { t } = useI18n()
const friends = useFriendStore()
const sessions = useSessionStore()
const pending = computed(() => friends.pendingCount)

const shortcuts = [
  { key: 'species',     to: '/species',    icon: BookOpen },
  { key: 'stats',       to: '/stats',      icon: BarChart3 },
  { key: 'leaderboard', to: '/classifica', icon: Trophy },
  { key: 'gare',        to: '/gare',       icon: Flag },
  { key: 'friends',     to: '/friends',    icon: UserPlus }
]
</script>

<style scoped>
/* Spazio in fondo: il pulsante di Fishy (56 px fisso a 16 px sopra la tab bar) non copre l'ultimo contenuto. */
@media (max-width: 767px) { .home { padding-bottom: calc(56px + 16px + var(--bottom-nav-h) + env(safe-area-inset-bottom)); } }

.home-grid { display: grid; gap: 16px; margin-bottom: 16px; }
.home-col { display: grid; gap: 16px; align-content: start; min-width: 0; }
@media (min-width: 768px) { .home-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start; } }
.home-col :deep(.globe-card) { margin-bottom: 0; }
.home-col :deep(.fp) { margin-bottom: 0; }

.ongoing-panel {
  @apply flex items-center gap-3 p-4 mb-4 rounded-xl border border-sand no-underline text-foam;
  background: rgb(var(--color-sand) / 0.1);
}
.ongoing-panel:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.ongoing-text { @apply flex flex-col min-w-0 flex-1; }
.ongoing-eyebrow { @apply text-xs font-bold uppercase text-sand-text; letter-spacing: 0.08em; }
.ongoing-name { @apply font-bold truncate; }
.btn-sand { @apply inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-sand text-on-primary font-bold shrink-0; }
.pulse-dot { @apply inline-flex h-3 w-3 rounded-full bg-sand shrink-0; }

.shortcuts { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
.shortcut {
  @apply relative flex flex-col items-center justify-center gap-1 min-h-[64px] px-2 py-2 rounded-xl border border-border bg-surface
         text-foam text-xs font-bold no-underline text-center transition-colors duration-200;
}
.shortcut svg { @apply text-ocean-text; }
.shortcut:hover { @apply border-ocean; }
.shortcut:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.shortcut .badge { position: absolute; top: 4px; right: 6px; }
</style>

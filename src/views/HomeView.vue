<template>
  <div>
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
import { useI18n } from 'vue-i18n'
import {
  Fish, Users, Newspaper, Pin, ShoppingBag, MessageSquare,
  BookOpen, MessagesSquare, UserCircle, UserPlus, BarChart3
} from 'lucide-vue-next'
import { useFriendStore } from '../stores/friends.js'

const { t } = useI18n()
const friends = useFriendStore()

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
</script>

<style scoped>
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

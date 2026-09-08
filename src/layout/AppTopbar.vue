<template>
  <header class="sticky top-0 z-[100] flex items-center gap-4 px-5 py-3 border-b border-border"
    style="background: rgb(var(--color-ink) / 0.92); backdrop-filter: blur(12px)">
    <button
      class="flex flex-col gap-1.5 p-1 bg-transparent border-none cursor-pointer group"
      @click="$emit('toggle-sidebar')"
    >
      <span class="block w-5 h-0.5 bg-foam rounded group-hover:bg-ocean transition-colors duration-200"></span>
      <span class="block w-5 h-0.5 bg-foam rounded group-hover:bg-ocean transition-colors duration-200"></span>
      <span class="block w-5 h-0.5 bg-foam rounded group-hover:bg-ocean transition-colors duration-200"></span>
    </button>
    <RouterLink to="/" class="text-foam text-lg font-extrabold tracking-tight hover:text-ocean transition-colors" style="display:inline-flex;align-items:center;gap:.4rem">
      <Fish :size="18" /> FishLog
    </RouterLink>

    <div class="ml-auto flex items-center gap-2">
      <div class="relative" ref="notifWrapper">
        <button
          class="relative flex items-center justify-center w-9 h-9 rounded-lg text-foam bg-surface-2 hover:bg-surface-2/70 transition-colors border-none cursor-pointer"
          :title="t('notifications.title')"
          @click="toggleNotifications"
        >
          <Bell :size="18" />
          <span v-if="notifications.unreadCount" class="notif-dot">{{ notifications.unreadCount }}</span>
        </button>

        <div v-if="notifPanelOpen" class="notif-panel card">
          <div class="notif-panel-header">
            <h4>{{ t('notifications.title') }}</h4>
            <div class="notif-panel-actions">
              <button v-if="notifications.unreadCount" class="btn btn-ghost btn-sm" @click="notifications.markAllRead()">
                {{ t('notifications.markAllRead') }}
              </button>
              <button v-if="notifications.items.length" class="btn btn-ghost btn-sm" @click="notifications.removeAll()">
                {{ t('notifications.deleteAll') }}
              </button>
            </div>
          </div>
          <p v-if="!notifications.items.length" class="text-muted text-sm p-3">{{ t('notifications.empty') }}</p>
          <ul v-else class="notif-list">
            <li v-for="n in notifications.items" :key="n._id" class="notif-row" :class="{ unread: !n.read }">
              <RouterLink :to="notificationLink(n)" class="notif-row-link" @click="onNotificationClick(n)">
                <span>{{ t(`notifications.types.${n.type}`, { name: n.actor?.displayName || n.actor?.email || '' }) }}</span>
                <span class="text-muted text-xs">{{ formatTime(n.createdAt) }}</span>
              </RouterLink>
              <button class="notif-remove" :title="t('notifications.delete')" @click="notifications.remove(n._id)">
                <X :size="14" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="relative" ref="createWrapper">
        <button
          class="relative flex items-center justify-center w-9 h-9 rounded-lg text-ink bg-ocean hover:bg-ocean/90 transition-colors border-none cursor-pointer"
          :title="t('createMenu.title')"
          @click="toggleCreateMenu"
        >
          <Plus :size="18" />
          <span v-if="sessions.ongoing && !onOngoingEditPage" class="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sand/70"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-sand"></span>
          </span>
        </button>

        <div v-if="createMenuOpen" class="create-menu card">
          <RouterLink
            v-if="sessions.ongoing && !onOngoingEditPage"
            :to="{ path: `/session/${sessions.ongoing._id}/edit`, hash: '#section-catches' }"
            class="create-menu-item create-menu-item-accent"
            @click="createMenuOpen = false"
          >
            <Fish :size="16" /> {{ t('createMenu.resumeSession') }}
          </RouterLink>
          <RouterLink to="/new" class="create-menu-item" @click="createMenuOpen = false">
            <Fish :size="16" /> {{ t('createMenu.newSession') }}
          </RouterLink>
          <RouterLink :to="{ path: '/feed', query: { compose: '1' } }" class="create-menu-item" @click="createMenuOpen = false">
            <Newspaper :size="16" /> {{ t('createMenu.newPost') }}
          </RouterLink>
          <RouterLink to="/market/new" class="create-menu-item" @click="createMenuOpen = false">
            <ShoppingBag :size="16" /> {{ t('createMenu.newListing') }}
          </RouterLink>
          <RouterLink to="/chat" class="create-menu-item" @click="createMenuOpen = false">
            <MessagesSquare :size="16" /> {{ t('createMenu.newMessage') }}
          </RouterLink>
          <RouterLink :to="{ path: '/groups', query: { compose: '1' } }" class="create-menu-item" @click="createMenuOpen = false">
            <Users :size="16" /> {{ t('createMenu.newGroup') }}
          </RouterLink>
        </div>
      </div>
    </div>

    <span
      v-if="!offline.online || offline.pendingCount || offline.hasErrors"
      class="text-xs font-mono px-2 py-1 rounded"
      :class="offline.hasErrors ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-muted'"
      :title="statusTitle"
      style="display:inline-flex;align-items:center;gap:.3rem"
    >
      <template v-if="!offline.online"><WifiOff :size="14" /></template>
      <template v-else-if="offline.syncing"><RefreshCw :size="14" /></template>
      <template v-else-if="offline.hasErrors"><AlertTriangle :size="14" /></template>
      <template v-else><Hourglass :size="14" /></template>
      <template v-if="offline.pendingCount"> {{ offline.pendingCount }}</template>
    </span>
  </header>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish, WifiOff, RefreshCw, AlertTriangle, Hourglass, Plus, Bell, X, Newspaper, ShoppingBag, MessagesSquare, Users } from 'lucide-vue-next'
import { useOfflineStore } from '../stores/offline.js'
import { useSessionStore } from '../stores/sessions.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationStore } from '../stores/notifications.js'

defineEmits(['toggle-sidebar'])

const { t, locale } = useI18n()
const route = useRoute()
const offline = useOfflineStore()
const sessions = useSessionStore()
const auth = useAuthStore()
const notifications = useNotificationStore()

const notifPanelOpen = ref(false)
const notifWrapper = ref(null)
const createMenuOpen = ref(false)
const createWrapper = ref(null)

function toggleNotifications() {
  createMenuOpen.value = false
  notifPanelOpen.value = !notifPanelOpen.value
  if (notifPanelOpen.value) notifications.fetchNotifications()
}

function toggleCreateMenu() {
  notifPanelOpen.value = false
  createMenuOpen.value = !createMenuOpen.value
}

function handleOutsideClick(event) {
  if (notifPanelOpen.value && notifWrapper.value && !notifWrapper.value.contains(event.target)) {
    notifPanelOpen.value = false
  }
  if (createMenuOpen.value && createWrapper.value && !createWrapper.value.contains(event.target)) {
    createMenuOpen.value = false
  }
}

function onNotificationClick(n) {
  notifications.markRead(n._id)
  notifPanelOpen.value = false
}

function notificationLink(n) {
  if (n.type === 'chat_message') return `/chat/${n.actor?._id || ''}`
  return '/friends'
}

function formatTime(date) {
  return new Date(date).toLocaleString(locale.value, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Sei già sulla pagina di modifica dell'uscita in corso: inutile mostrare
// anche l'icona di scorciatoia nella topbar.
const onOngoingEditPage = computed(() =>
  sessions.ongoing && route.path === `/session/${sessions.ongoing._id}/edit`
)

onMounted(() => {
  if (auth.isLoggedIn) sessions.fetchOngoing()
  document.addEventListener('click', handleOutsideClick)
})
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))

const statusTitle = computed(() => {
  if (!offline.online) return t('offline.offlineBanner')
  if (offline.hasErrors) return t('offline.errorBanner')
  if (offline.syncing) return t('offline.syncingBanner', { n: offline.pendingCount })
  if (offline.pendingCount) return t('offline.pendingBanner', { n: offline.pendingCount })
  return ''
})
</script>

<style scoped>
.notif-dot {
  @apply absolute -top-1 -right-1 bg-danger text-white text-[0.65rem] font-bold rounded-full px-1.5 py-0.5 leading-none;
}
.notif-panel {
  @apply fixed right-3 max-h-96 overflow-y-auto z-[110] p-0;
  top: 3.75rem;
  width: min(20rem, calc(100vw - 1.5rem));
}
.notif-panel-header {
  @apply flex items-center justify-between px-3 py-2 border-b border-border gap-2;
}
.notif-panel-header h4 { @apply font-semibold text-sm; }
.notif-panel-actions { @apply flex items-center gap-1; }
.notif-list { @apply divide-y divide-border; }
.notif-row {
  @apply flex items-center gap-1 hover:bg-surface-2 transition-colors;
}
.notif-row.unread { @apply bg-ocean/5; }
.notif-row-link {
  @apply flex-1 min-w-0 flex flex-col gap-0.5 px-3 py-2 text-sm no-underline text-inherit;
}
.notif-row.unread .notif-row-link { @apply font-medium; }
.notif-remove {
  @apply flex items-center justify-center w-7 h-7 mr-2 rounded text-muted bg-transparent border-none
         cursor-pointer hover:text-danger hover:bg-danger/10 transition-colors shrink-0;
}

.create-menu {
  @apply fixed right-3 z-[110] p-1.5 flex flex-col gap-0.5;
  top: 3.75rem;
  width: min(14rem, calc(100vw - 1.5rem));
}
.create-menu-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-semibold text-foam no-underline
         hover:bg-surface-2 transition-colors;
}
.create-menu-item-accent {
  @apply text-ink;
  background: var(--sand);
}
.create-menu-item-accent:hover {
  opacity: .9;
}
</style>
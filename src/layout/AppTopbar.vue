<template>
  <header class="sticky top-0 z-[100] flex items-center gap-4 px-5 py-3 border-b border-border"
    style="background: rgba(13,17,23,0.92); backdrop-filter: blur(12px)">
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

    <RouterLink
      v-if="sessions.ongoing && !onOngoingEditPage"
      :to="{ path: `/session/${sessions.ongoing._id}/edit`, hash: '#section-catches' }"
      class="ml-auto relative flex items-center justify-center w-9 h-9 rounded-lg text-ink bg-sand hover:bg-sand/90 transition-colors"
      :title="t('nav.ongoingSession')"
    >
      <Fish :size="18" />
      <span class="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink/60"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-ink"></span>
      </span>
    </RouterLink>
    <RouterLink
      v-else-if="!sessions.ongoing"
      to="/new"
      class="ml-auto flex items-center gap-1.5 px-3 h-9 rounded-lg text-ink bg-ocean hover:bg-ocean/90 transition-colors text-sm font-semibold"
      :title="t('nav.newSession')"
    >
      <Plus :size="18" /> {{ t('nav.newSession') }}
    </RouterLink>

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
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Fish, WifiOff, RefreshCw, AlertTriangle, Hourglass, Plus } from 'lucide-vue-next'
import { useOfflineStore } from '../stores/offline.js'
import { useSessionStore } from '../stores/sessions.js'
import { useAuthStore } from '../stores/auth.js'

defineEmits(['toggle-sidebar'])

const { t } = useI18n()
const route = useRoute()
const offline = useOfflineStore()
const sessions = useSessionStore()
const auth = useAuthStore()

// Sei già sulla pagina di modifica dell'uscita in corso: inutile mostrare
// anche l'icona di scorciatoia nella topbar.
const onOngoingEditPage = computed(() =>
  sessions.ongoing && route.path === `/session/${sessions.ongoing._id}/edit`
)

onMounted(() => { if (auth.isLoggedIn) sessions.fetchOngoing() })

const statusTitle = computed(() => {
  if (!offline.online) return t('offline.offlineBanner')
  if (offline.hasErrors) return t('offline.errorBanner')
  if (offline.syncing) return t('offline.syncingBanner', { n: offline.pendingCount })
  if (offline.pendingCount) return t('offline.pendingBanner', { n: offline.pendingCount })
  return ''
})
</script>
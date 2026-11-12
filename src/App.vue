<template>
  <div v-if="isPublicRoute" class="flex flex-col min-h-dvh">
    <main class="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <PageTransition />
    </main>
    <LegalFooter />
    <ToastHost />
    <ConfirmHost />
    <LocalStorageNotice />
  </div>

  <div v-else class="flex" :class="isFullHeight ? 'h-dvh overflow-hidden' : 'min-h-dvh'">
    <!-- Overlay -->
    <div
      v-if="sidebarOpen && !sidebarLocked"
      class="fixed inset-0 z-[199] bg-black/50"
      @click="sidebarOpen = false"
    />

    <AppSidebar
      :open="sidebarOpen"
      :locked="sidebarLocked"
      @close="closeSidebar"
      @toggle-lock="toggleLock"
    />

    <div
      class="flex flex-col flex-1 min-w-0 min-h-0 transition-[margin] duration-300"
      :class="sidebarLocked ? 'ml-60' : 'ml-0'"
    >
      <AppTopbar :class="{ 'max-md:hidden': route.meta.ownHeader }" @toggle-sidebar="toggleSidebar" />
      <main
        class="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 min-w-0"
        :class="[isFullHeight ? 'flex flex-col min-h-0 overflow-hidden' : (route.meta.ownHeader ? 'pt-4 pb-8 md:py-8' : 'pt-3 pb-8 md:py-8'), showBottomNav ? 'pb-[calc(var(--bottom-nav-h)+1.5rem+env(safe-area-inset-bottom)*0.3)] md:pb-8' : '']"
      >
        <PageTransition />
      </main>
      <LegalFooter v-if="!isFullHeight" />
    </div>

    <AppBottomNav v-if="showBottomNav" />
    <ToastHost />
    <ConfirmHost />
    <LocalStorageNotice />
    <MarketSurveyModal />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './layout/AppSidebar.vue'
import AppTopbar  from './layout/AppTopbar.vue'
import AppBottomNav from './layout/AppBottomNav.vue'
import ConfirmHost from './components/ConfirmHost.vue'
import ToastHost from './components/motion/ToastHost.vue'
import PageTransition from './components/motion/PageTransition.vue'
import LegalFooter from './components/LegalFooter.vue'
import LocalStorageNotice from './components/LocalStorageNotice.vue'
import MarketSurveyModal from './components/MarketSurveyModal.vue'
import { useAuthStore } from './stores/auth.js'
import { usePostStore } from './stores/posts.js'
import { useChatStore } from './stores/chat.js'
import { useFriendStore } from './stores/friends.js'
import { useNotificationStore } from './stores/notifications.js'
import { connectWebSocket, disconnectWebSocket, ensureConnected } from './services/ws.js'

const route = useRoute()

const isPublicRoute = computed(() => !!route.meta.public)
const isFullHeight  = computed(() => !!route.meta.fullHeight)
const showBottomNav = computed(() => !route.meta.hideBottomNav)

// Viste a scroll interno (chat, feed): il documento non deve scorrere. Il body ha min-h-screen (100vh, più alto
// dell'area visibile su iOS Safari), quindi senza blocco scorre l'intera pagina invece della lista interna.
watch(isFullHeight, (v) => document.documentElement.classList.toggle('lock-doc-scroll', v), { immediate: true })
onBeforeUnmount(() => document.documentElement.classList.remove('lock-doc-scroll'))

provide('toggleSidebar', () => { sidebarOpen.value = !sidebarOpen.value })
const sidebarOpen   = ref(false)
const sidebarLocked = ref(localStorage.getItem('sidebar_locked') === 'true')
const auth    = useAuthStore()
const posts   = usePostStore()
const chat    = useChatStore()
const friends = useFriendStore()
const notifications = useNotificationStore()

onMounted(() => {
  if (sidebarLocked.value) sidebarOpen.value = true
  if (auth.isLoggedIn) {
    posts.fetchUnreadCount()
    chat.fetchUnreadCount()
    friends.fetchRequests()
    notifications.fetchUnreadCount()
    connectWebSocket()
  }
})

watch(() => auth.isLoggedIn, (loggedIn) => {
  if (!loggedIn) { disconnectWebSocket(); return }
  syncBadges()
  ensureConnected()
})

// Badge e richieste restano aggiornati anche se il websocket è stato sospeso
// (app in background, rete assente): risincronizza al ritorno in primo piano,
// quando torna la rete e ogni 30 s mentre l'app è visibile.
function syncBadges() {
  if (!auth.isLoggedIn) return
  notifications.fetchUnreadCount()
  chat.fetchUnreadCount()
  posts.fetchUnreadCount()
  friends.fetchRequests()
}
function resync() {
  if (document.visibilityState === 'hidden') return
  ensureConnected()
  syncBadges()
}
let pollTimer = null
onMounted(() => {
  document.addEventListener('visibilitychange', resync)
  window.addEventListener('focus', resync)
  window.addEventListener('online', resync)
  pollTimer = setInterval(resync, 30000)
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', resync)
  window.removeEventListener('focus', resync)
  window.removeEventListener('online', resync)
  clearInterval(pollTimer)
})

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar()  { if (!sidebarLocked.value) sidebarOpen.value = false }
function toggleLock() {
  sidebarLocked.value = !sidebarLocked.value
  localStorage.setItem('sidebar_locked', String(sidebarLocked.value))
  sidebarOpen.value = sidebarLocked.value
}
</script>
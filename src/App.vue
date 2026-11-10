<template>
  <div v-if="isPublicRoute" class="flex flex-col min-h-dvh">
    <main class="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <RouterView v-slot="{ Component, route: r }">
        <Transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="r.path" />
        </Transition>
      </RouterView>
    </main>
    <LegalFooter />
    <ToastContainer />
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
        :class="[isFullHeight ? 'flex flex-col min-h-0 overflow-hidden' : (route.meta.ownHeader ? 'pt-4 pb-8 md:py-8' : 'py-8'), showBottomNav ? 'pb-[calc(var(--bottom-nav-h)+1rem)] md:pb-8' : '']"
      >
        <RouterView v-slot="{ Component, route: r }">
          <Transition :name="transitionName" mode="out-in">
            <component :is="Component" :key="r.path" :class="{ 'page-fill': isFullHeight }" />
          </Transition>
        </RouterView>
      </main>
      <LegalFooter v-if="!isFullHeight" />
    </div>

    <AppBottomNav v-if="showBottomNav" />
    <ToastContainer />
    <LocalStorageNotice />
    <MarketSurveyModal />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppSidebar from './layout/AppSidebar.vue'
import AppTopbar  from './layout/AppTopbar.vue'
import AppBottomNav from './layout/AppBottomNav.vue'
import ToastContainer from './components/ToastContainer.vue'
import LegalFooter from './components/LegalFooter.vue'
import LocalStorageNotice from './components/LocalStorageNotice.vue'
import MarketSurveyModal from './components/MarketSurveyModal.vue'
import { useAuthStore } from './stores/auth.js'
import { usePostStore } from './stores/posts.js'
import { useChatStore } from './stores/chat.js'
import { useFriendStore } from './stores/friends.js'
import { useNotificationStore } from './stores/notifications.js'
import { connectWebSocket, disconnectWebSocket } from './services/ws.js'

const route = useRoute()
const router = useRouter()

// Transizioni di pagina: dissolvenza tra le sezioni della barra in basso,
// scorrimento laterale quando si entra in una pagina più "profonda" (o si
// torna indietro). Brevi (~150 ms per fase) e disattivate con
// prefers-reduced-motion (regola globale in main.css).
const TAB_ROOTS = ['/', '/sessions', '/feed', '/market', '/chat']
const transitionName = ref('page-fade')
const depth = (p) => p.split('/').filter(Boolean).length
router.beforeEach((to, from) => {
  if (!from.name) { transitionName.value = 'page-fade'; return }
  const bothTabs = TAB_ROOTS.includes(to.path) && TAB_ROOTS.includes(from.path)
  const d = depth(to.path) - depth(from.path)
  transitionName.value = bothTabs || d === 0 ? 'page-fade' : (d > 0 ? 'page-forward' : 'page-back')
})
const isPublicRoute = computed(() => !!route.meta.public)
const isFullHeight  = computed(() => !!route.meta.fullHeight)
const showBottomNav = computed(() => !route.meta.hideBottomNav)

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
  if (!loggedIn) disconnectWebSocket()
})

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar()  { if (!sidebarLocked.value) sidebarOpen.value = false }
function toggleLock() {
  sidebarLocked.value = !sidebarLocked.value
  localStorage.setItem('sidebar_locked', String(sidebarLocked.value))
  sidebarOpen.value = sidebarLocked.value
}
</script>
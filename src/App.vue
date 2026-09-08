<template>
  <div v-if="isPublicRoute" class="flex min-h-dvh">
    <main class="flex-1 w-full max-w-[1100px] mx-auto px-6 py-8">
      <RouterView />
    </main>
    <ToastContainer />
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
      <AppTopbar @toggle-sidebar="toggleSidebar" />
      <main
        class="flex-1 w-full max-w-[1100px] mx-auto px-6"
        :class="isFullHeight ? 'flex flex-col min-h-0 overflow-hidden' : 'py-8'"
      >
        <RouterView />
      </main>
    </div>

    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from './layout/AppSidebar.vue'
import AppTopbar  from './layout/AppTopbar.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useAuthStore } from './stores/auth.js'
import { usePostStore } from './stores/posts.js'
import { useChatStore } from './stores/chat.js'
import { useFriendStore } from './stores/friends.js'
import { useNotificationStore } from './stores/notifications.js'
import { connectWebSocket, disconnectWebSocket } from './services/ws.js'

const route = useRoute()
const isPublicRoute = computed(() => !!route.meta.public)
const isFullHeight  = computed(() => !!route.meta.fullHeight)

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
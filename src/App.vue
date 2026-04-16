<template>
  <div class="flex min-h-dvh">
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
      class="flex flex-col flex-1 min-w-0 transition-[margin] duration-300"
      :class="sidebarLocked ? 'ml-60' : 'ml-0'"
    >
      <AppTopbar @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 w-full max-w-[1100px] mx-auto px-6 py-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from './layout/AppSidebar.vue'
import AppTopbar  from './layout/AppTopbar.vue'

const sidebarOpen   = ref(false)
const sidebarLocked = ref(localStorage.getItem('sidebar_locked') === 'true')

onMounted(() => { if (sidebarLocked.value) sidebarOpen.value = true })

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar()  { if (!sidebarLocked.value) sidebarOpen.value = false }
function toggleLock() {
  sidebarLocked.value = !sidebarLocked.value
  localStorage.setItem('sidebar_locked', String(sidebarLocked.value))
  sidebarOpen.value = sidebarLocked.value
}
</script>
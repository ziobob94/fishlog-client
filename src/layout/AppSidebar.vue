<template>
  <aside
    class="fixed inset-y-0 left-0 z-[200] w-60 flex flex-col bg-surface border-r border-border transition-all duration-300"
    :class="open ? 'translate-x-0 shadow-[4px_0_32px_rgba(0,0,0,0.4)]' : '-translate-x-full'"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-border">
      <RouterLink
        to="/"
        class="flex items-center gap-2 text-foam text-lg font-extrabold tracking-tight hover:text-ocean"
        @click="$emit('close')"
      >
        🎣 <span>FishLog</span>
      </RouterLink>
      <button
        class="p-1 bg-transparent border-none cursor-pointer text-base transition-opacity duration-200"
        :class="locked ? 'opacity-100' : 'opacity-40 hover:opacity-100'"
        :title="locked ? 'Sblocca' : 'Blocca'"
        @click="$emit('toggle-lock')"
      >{{ locked ? '📌' : '📍' }}</button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 flex flex-col gap-0.5 overflow-y-auto p-3">
      <RouterLink to="/" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center">🎣</span> Uscite
      </RouterLink>
      <RouterLink to="/new" class="nav-item nav-accent mb-2" @click="$emit('close')">
        <span class="w-5 text-center font-bold">+</span> Nuova uscita
      </RouterLink>
      <RouterLink to="/groups" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center">🫂</span> Gruppi
      </RouterLink>
      <RouterLink
        v-if="auth.user?.role === 'admin'"
        to="/admin"
        class="nav-item"
        @click="$emit('close')"
      >
        <span class="w-5 text-center">⚙️</span> Admin
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="border-t border-border p-4 flex flex-col gap-3">
      <template v-if="auth.isLoggedIn">
        <div class="flex items-center gap-2.5">
          <img
            v-if="auth.user?.avatar"
            :src="auth.user.avatar"
            class="w-9 h-9 rounded-full object-cover shrink-0"
          />
          <span
            v-else
            class="w-9 h-9 shrink-0 rounded-full border border-ocean text-ocean flex items-center justify-center text-xs font-bold"
            style="background: var(--ocean-glow)"
          >{{ initials }}</span>
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="text-sm font-semibold truncate text-foam">{{ auth.user?.displayName }}</span>
            <span class="badge badge-ocean" style="font-size:.6rem; align-self:flex-start">{{ auth.user?.role }}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm w-full" @click="logout">Esci</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="btn btn-primary w-full text-center" @click="$emit('close')">
          Accedi
        </RouterLink>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

defineProps({
  open:   { type: Boolean, default: false },
  locked: { type: Boolean, default: false }
})
defineEmits(['close', 'toggle-lock'])

const auth   = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const name = auth.user?.displayName || auth.user?.email || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-semibold
         text-muted transition-all duration-200 hover:bg-surface-2 hover:text-foam;
}
.nav-item.router-link-active { @apply text-ocean; background: var(--ocean-glow); }
.nav-accent                  { background: var(--ocean-glow); @apply border border-ocean/20 text-ocean hover:bg-ocean hover:text-white; }
.nav-accent.router-link-active { @apply bg-ocean text-white; }
</style>
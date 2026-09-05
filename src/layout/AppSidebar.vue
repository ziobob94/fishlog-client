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
        <Fish :size="20" /> <span>FishLog</span>
      </RouterLink>
      <button
        class="p-1 bg-transparent border-none cursor-pointer text-base transition-opacity duration-200"
        :class="locked ? 'opacity-100' : 'opacity-40 hover:opacity-100'"
        :title="locked ? t('nav.unlock') : t('nav.lock')"
        @click="$emit('toggle-lock')"
      ><component :is="locked ? Pin : MapPin" :size="16" /></button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 flex flex-col gap-0.5 overflow-y-auto p-3">
      <RouterLink to="/" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Home :size="16" /></span> {{ t('nav.home') }}
      </RouterLink>
      <RouterLink to="/sessions" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Fish :size="16" /></span> {{ t('nav.sessions') }}
      </RouterLink>
    <!--  <RouterLink :to="newSessionTarget" class="nav-item nav-accent mb-2" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center">
          <component :is="sessions.ongoing ? Waves : Plus" :size="16" />
        </span>
        {{ sessions.ongoing ? t('nav.ongoingSession') : t('nav.newSession') }}
      </RouterLink> -->
      <RouterLink to="/groups" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Users :size="16" /></span> {{ t('nav.groups') }}
      </RouterLink>
      <RouterLink to="/feed" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Newspaper :size="16" /></span> {{ t('nav.feed') }}
      </RouterLink>
      <RouterLink to="/board" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Pin :size="16" /></span> {{ t('nav.board') }}
      </RouterLink>
      <RouterLink to="/stats" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><BarChart3 :size="16" /></span> {{ t('nav.stats') }}
      </RouterLink>
      <RouterLink to="/profile" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><UserCircle :size="16" /></span> {{ t('nav.profile') }}
      </RouterLink>
      <RouterLink
        v-if="auth.user?.role === 'admin'"
        to="/admin"
        class="nav-item"
        @click="$emit('close')"
      >
        <span class="w-5 text-center flex justify-center"><Settings :size="16" /></span> {{ t('nav.admin') }}
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="border-t border-border p-4 flex flex-col gap-3">
      <template v-if="auth.isLoggedIn">
        <RouterLink to="/profile" class="flex items-center gap-2.5" @click="$emit('close')">
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
        </RouterLink>
        <button class="btn btn-ghost btn-sm w-full" @click="logout">{{ t('nav.logout') }}</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="btn btn-primary w-full text-center" @click="$emit('close')">
          {{ t('common.login') }}
        </RouterLink>
      </template>
    </div>
  </aside>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { RouterLink, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { Fish, Home, Pin, MapPin, Users, Newspaper, Settings, BarChart3, UserCircle, Plus, Waves } from 'lucide-vue-next'
  import { useAuthStore } from '../stores/auth.js'
  import { useSessionStore } from '../stores/sessions.js'

  const { t } = useI18n()
  defineProps({
    open: { type: Boolean, default: false },
    locked: { type: Boolean, default: false }
  })
  defineEmits(['close', 'toggle-lock'])

  const auth = useAuthStore()
  const router = useRouter()
  const sessions = useSessionStore()

  onMounted(() => { if (auth.isLoggedIn) sessions.fetchOngoing() })

  const newSessionTarget = computed(() =>
    sessions.ongoing
      ? { path: `/session/${sessions.ongoing._id}/edit`, hash: '#section-catches' }
      : { path: '/new' }
  )

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
    @apply flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-semibold text-muted transition-all duration-200 hover:bg-surface-2 hover:text-foam;
  }

  .nav-item.router-link-active {
    @apply text-ocean;
    background: var(--ocean-glow);
  }

  .nav-accent {
    background: var(--ocean-glow);
    @apply border border-ocean/20 text-ocean hover:bg-ocean hover:text-white;
  }

  .nav-accent.router-link-active {
    @apply bg-ocean text-white;
  }
</style>
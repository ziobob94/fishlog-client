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

      <div class="nav-section-label">{{ t('nav.sections.fishing') }}</div>
      <RouterLink to="/sessions" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Fish :size="16" /></span> {{ t('nav.sessions') }}
      </RouterLink>
      <RouterLink to="/stats" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><BarChart3 :size="16" /></span> {{ t('nav.stats') }}
      </RouterLink>

      <div class="nav-section-label">{{ t('nav.sections.community') }}</div>
      <RouterLink to="/feed" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Newspaper :size="16" /></span> {{ t('nav.feed') }}
        <span v-if="posts.unread.feed" class="nav-badge">{{ posts.unread.feed }}</span>
      </RouterLink>
      <RouterLink to="/board" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Pin :size="16" /></span> {{ t('nav.board') }}
        <span v-if="posts.unread.board" class="nav-badge">{{ posts.unread.board }}</span>
      </RouterLink>
      <RouterLink to="/groups" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Users :size="16" /></span> {{ t('nav.groups') }}
      </RouterLink>
      <RouterLink to="/friends" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><UserPlus :size="16" /></span> {{ t('nav.friends') }}
        <span v-if="friends.pendingCount" class="nav-badge">{{ friends.pendingCount }}</span>
      </RouterLink>
      <RouterLink to="/chat" class="nav-item" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><MessagesSquare :size="16" /></span> {{ t('nav.chat') }}
        <span v-if="chat.unreadCount" class="nav-badge">{{ chat.unreadCount }}</span>
      </RouterLink>
      <div class="nav-item nav-item-disabled" :title="t('home.hub.comingSoon')">
        <span class="w-5 text-center flex justify-center"><MessageSquare :size="16" /></span> {{ t('nav.forum') }}
        <span class="nav-soon-badge badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
      </div>
      <div class="nav-item nav-item-disabled" :title="t('home.hub.comingSoon')">
        <span class="w-5 text-center flex justify-center"><BookOpen :size="16" /></span> {{ t('nav.culture') }}
        <span class="nav-soon-badge badge badge-sand">{{ t('home.hub.comingSoon') }}</span>
      </div>

      <RouterLink to="/market" class="nav-item mt-1" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><ShoppingBag :size="16" /></span> {{ t('nav.market') }}
      </RouterLink>
      <RouterLink to="/market/mine" class="nav-item nav-subitem" @click="$emit('close')">
        <span class="w-5 text-center flex justify-center"><Tag :size="14" /></span> {{ t('nav.myListings') }}
      </RouterLink>

      <div class="nav-section-label">{{ t('nav.sections.account') }}</div>
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
  import { Fish, Home, Pin, MapPin, Users, UserPlus, Newspaper, MessagesSquare, Settings, BarChart3, UserCircle, Plus, Waves, ShoppingBag, Tag, MessageSquare, BookOpen } from 'lucide-vue-next'
  import { useAuthStore } from '../stores/auth.js'
  import { useSessionStore } from '../stores/sessions.js'
  import { usePostStore } from '../stores/posts.js'
  import { useChatStore } from '../stores/chat.js'
  import { useFriendStore } from '../stores/friends.js'

  const { t } = useI18n()
  defineProps({
    open: { type: Boolean, default: false },
    locked: { type: Boolean, default: false }
  })
  defineEmits(['close', 'toggle-lock'])

  const auth = useAuthStore()
  const router = useRouter()
  const sessions = useSessionStore()
  const posts = usePostStore()
  const chat = useChatStore()
  const friends = useFriendStore()

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

  .nav-badge {
    @apply ml-auto bg-danger text-white text-[0.65rem] font-bold rounded-full px-1.5 py-0.5 leading-none;
  }

  .nav-section-label {
    @apply px-3 pt-4 pb-1 text-[0.68rem] font-bold uppercase tracking-wide text-muted;
  }

  .nav-section-label:first-child {
    @apply pt-1;
  }

  .nav-subitem {
    @apply pl-8 text-[0.85rem] font-medium;
  }

  .nav-item-disabled {
    @apply cursor-default opacity-60;
  }

  .nav-item-disabled:hover {
    @apply bg-transparent text-muted;
  }

  .nav-soon-badge {
    @apply ml-auto text-[0.6rem] px-1.5 py-0.5 leading-none;
  }
</style>
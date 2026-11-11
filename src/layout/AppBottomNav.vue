<template>
  <nav class="bottom-nav" :aria-label="t('nav.mainNavigation')">
    <RouterLink to="/" class="bottom-nav-item" exact-active-class="router-link-active">
      <AppIcon name="home" :size="22" />
      <span>{{ t('nav.home') }}</span>
    </RouterLink>
    <RouterLink to="/sessions" class="bottom-nav-item">
      <AppIcon name="uscite" :size="22" />
      <span>{{ t('nav.sessions') }}</span>
    </RouterLink>
    <button type="button" class="bottom-nav-item bottom-nav-plus" :aria-label="t('createMenu.title')" aria-haspopup="dialog" @click="onPlus">
      <span class="bottom-nav-plus-btn"><Plus :size="28" :stroke-width="2.6" /></span>
    </button>
    <CreateSheet :open="sheetOpen" @close="sheetOpen = false" />
    <RouterLink to="/feed" class="bottom-nav-item" :class="{ 'router-link-active': isCommunity }">
      <AppIcon name="community" :size="22" />
      <span>{{ t('nav.community') }}</span>
      <span v-if="posts.unread.feed || chat.unreadCount" class="bottom-nav-dot"></span>
    </RouterLink>
    <RouterLink to="/market" class="bottom-nav-item">
      <AppIcon name="market" :size="22" />
      <span>{{ t('nav.market') }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import CreateSheet from '../components/CreateSheet.vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '../components/AppIcon.vue'
import { usePostStore } from '../stores/posts.js'
import { useChatStore } from '../stores/chat.js'
import { useSessionStore } from '../stores/sessions.js'

const { t } = useI18n()
const posts = usePostStore()
const chat  = useChatStore()
const sessions = useSessionStore()
const route = useRoute()
const router = useRouter()
const sheetOpen = ref(false)

// Il «+» apre il foglio «Crea» in tutte le pagine.
function onPlus() {
  sheetOpen.value = true
}

// Community raggruppa feed, bacheca, chat, gruppi e amici
const isCommunity = computed(() => /^\/(feed|board|chat|groups|friends|users)/.test(route.path))

const newSessionTarget = computed(() =>
  sessions.ongoing
    ? { path: `/session/${sessions.ongoing._id}/edit`, hash: '#section-catches' }
    : { path: '/new' }
)
</script>

<style scoped>
/* Solo mobile: su schermi più larghi resta la sidebar. */
.bottom-nav {
  @apply fixed bottom-0 inset-x-0 z-[150] grid grid-cols-5 items-stretch
         bg-surface border-t border-border md:hidden;
  min-height: var(--bottom-nav-h);
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
  @apply relative flex flex-col items-center justify-center gap-0.5
         min-h-[44px] py-2 text-muted text-[0.68rem] font-semibold no-underline transition-colors duration-200;
}

.bottom-nav-item.router-link-active {
  @apply text-ocean-text;
}

.bottom-nav-plus { @apply overflow-visible bg-transparent border-none cursor-pointer; }
.bottom-nav-plus-btn {
  @apply flex items-center justify-center w-14 h-14 rounded-full bg-ocean text-on-primary border-4 border-ink;
  margin-top: -30px;
}

.bottom-nav-dot {
  @apply absolute top-1 right-[calc(50%-16px)] w-2 h-2 rounded-full bg-danger;
}
</style>

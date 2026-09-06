<template>
  <nav class="bottom-nav md:hidden">
    <RouterLink to="/" class="bottom-nav-item">
      <Home :size="20" /> <span>{{ t('nav.home') }}</span>
    </RouterLink>
    <RouterLink to="/feed" class="bottom-nav-item">
      <span class="icon-wrap">
        <Newspaper :size="20" />
        <span v-if="posts.unread.feed" class="unread-dot"></span>
      </span>
      <span>{{ t('nav.feed') }}</span>
    </RouterLink>
    <RouterLink to="/market" class="bottom-nav-item">
      <ShoppingBag :size="20" /> <span>{{ t('nav.market') }}</span>
    </RouterLink>
    <RouterLink to="/chat" class="bottom-nav-item">
      <span class="icon-wrap">
        <MessagesSquare :size="20" />
        <span v-if="chat.unreadCount" class="unread-dot"></span>
      </span>
      <span>{{ t('nav.chat') }}</span>
    </RouterLink>
    <RouterLink to="/profile" class="bottom-nav-item">
      <UserCircle :size="20" />
      <span>{{ t('nav.profile') }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Newspaper, ShoppingBag, MessagesSquare, UserCircle } from 'lucide-vue-next'
import { usePostStore } from '../stores/posts.js'
import { useChatStore } from '../stores/chat.js'

const { t } = useI18n()
const posts = usePostStore()
const chat = useChatStore()
</script>

<style scoped>
.bottom-nav {
  @apply fixed bottom-0 inset-x-0 z-[150] flex items-stretch justify-around
         bg-surface border-t border-border;
  padding-bottom: env(safe-area-inset-bottom);
}
.bottom-nav-item {
  @apply flex-1 flex flex-col items-center justify-center gap-0.5 py-2
         text-[0.65rem] font-semibold text-muted transition-colors duration-200;
}
.bottom-nav-item.router-link-active { @apply text-ocean; }

.icon-wrap { @apply relative inline-flex; }
.unread-dot {
  @apply absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-danger;
  box-shadow: 0 0 0 2px var(--surface, #0a1929);
}
</style>

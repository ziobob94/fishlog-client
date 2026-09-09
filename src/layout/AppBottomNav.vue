<template>
  <nav class="bottom-nav">
    <RouterLink to="/" class="bottom-nav-item">
      <Home :size="20" />
      <span>{{ t('nav.home') }}</span>
    </RouterLink>
    <RouterLink to="/sessions" class="bottom-nav-item">
      <Fish :size="20" />
      <span>{{ t('nav.sessions') }}</span>
    </RouterLink>
    <RouterLink to="/feed" class="bottom-nav-item">
      <Newspaper :size="20" />
      <span>{{ t('nav.feed') }}</span>
      <span v-if="posts.unread.feed" class="bottom-nav-dot"></span>
    </RouterLink>
    <RouterLink to="/market" class="bottom-nav-item">
      <ShoppingBag :size="20" />
      <span>{{ t('nav.market') }}</span>
    </RouterLink>
    <RouterLink to="/chat" class="bottom-nav-item">
      <MessagesSquare :size="20" />
      <span>{{ t('nav.chat') }}</span>
      <span v-if="chat.unreadCount" class="bottom-nav-dot"></span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Fish, Newspaper, ShoppingBag, MessagesSquare } from 'lucide-vue-next'
import { usePostStore } from '../stores/posts.js'
import { useChatStore } from '../stores/chat.js'

const { t } = useI18n()
const posts = usePostStore()
const chat  = useChatStore()
</script>

<style scoped>
/* Solo mobile: su schermi più larghi resta la sidebar, che ha già spazio
   per tutte le voci senza doverne nascondere la maggior parte. */
.bottom-nav {
  @apply fixed bottom-0 inset-x-0 z-[150] flex items-stretch justify-around
         bg-surface border-t border-border md:hidden;
  min-height: var(--bottom-nav-h);
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
  @apply relative flex-1 flex flex-col items-center justify-center gap-0.5
         py-2 text-muted text-[0.65rem] font-semibold no-underline transition-colors duration-200;
}

.bottom-nav-item.router-link-active {
  @apply text-ocean;
}

.bottom-nav-dot {
  @apply absolute top-1 right-[calc(50%-16px)] w-2 h-2 rounded-full bg-danger;
}
</style>

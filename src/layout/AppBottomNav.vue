<template>
  <nav class="bottom-nav md:hidden">
    <RouterLink to="/" class="bottom-nav-item">
      <Home :size="20" /> <span>{{ t('nav.home') }}</span>
    </RouterLink>
    <RouterLink to="/feed" class="bottom-nav-item">
      <Newspaper :size="20" /> <span>{{ t('nav.feed') }}</span>
    </RouterLink>
    <RouterLink to="/market" class="bottom-nav-item">
      <ShoppingBag :size="20" /> <span>{{ t('nav.market') }}</span>
    </RouterLink>
    <RouterLink to="/chat" class="bottom-nav-item">
      <MessagesSquare :size="20" /> <span>{{ t('nav.chat') }}</span>
    </RouterLink>
    <RouterLink to="/profile" class="bottom-nav-item">
      <UserCircle :size="20" /> <span>{{ t('nav.profile') }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Newspaper, ShoppingBag, MessagesSquare, UserCircle } from 'lucide-vue-next'

const { t } = useI18n()
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
</style>

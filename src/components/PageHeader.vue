<template>
  <header class="page-header" :class="{ 'page-header-sticky': sticky }">
    <button v-if="back" type="button" class="ph-btn ph-back" :aria-label="t('common.back')" @click="goBack">
      <component :is="closeIcon ? X : ArrowLeft" :size="20" />
    </button>
    <h1 class="ph-title" :class="{ 'ph-title-sub': back }">{{ title }}</h1>
    <div class="ph-actions">
      <slot />
      <RouterLink v-if="bell" to="/notifications" class="ph-btn ph-bell" :aria-label="t('notifications.title')">
        <Bell :size="18" />
        <span v-if="notifications.unreadCount" class="ph-dot" aria-hidden="true"></span>
      </RouterLink>
    </div>
  </header>
</template>

<script setup>
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, X, Bell } from 'lucide-vue-next'
import { useNotificationStore } from '../stores/notifications.js'

// Intestazione di schermata del nuovo design: titolo grande per le schermate
// principali, freccia + titolo per quelle di secondo livello. Su mobile
// sostituisce la barra con il logo (che resta solo nella Home).
const props = defineProps({
  title: { type: String, required: true },
  back: { type: [Boolean, String], default: false },   // true = indietro, stringa = rotta
  closeIcon: { type: Boolean, default: false },
  bell: { type: Boolean, default: false },
  sticky: { type: Boolean, default: false }
})

const { t } = useI18n()
const router = useRouter()
const notifications = useNotificationStore()

function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.page-header { @apply flex items-center gap-3 mb-4 min-h-[44px]; }
.page-header-sticky { @apply sticky top-0 z-30 bg-ink py-3 mb-0 border-b border-border; }
.ph-title { @apply text-[1.65rem] leading-tight font-bold text-foam flex-1 min-w-0 truncate; }
.ph-title-sub { @apply text-xl; }
.ph-actions { @apply flex items-center gap-2 ml-auto shrink-0; }
.ph-btn {
  @apply relative flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-foam bg-surface border border-border cursor-pointer no-underline;
}
.ph-back { @apply bg-transparent border-transparent -ml-2; }
.ph-dot { @apply absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-sand; }
/* Sul desktop la campanella sta già nella barra in alto. */
.ph-bell { @apply md:hidden; }
</style>

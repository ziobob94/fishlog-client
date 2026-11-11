<template>
  <header class="page-header" :class="{ 'page-header-sticky': sticky, 'page-header-compact': compact }">
    <button v-if="back" type="button" class="ph-btn ph-back" :aria-label="t('common.back')" @click="goBack">
      <component :is="closeIcon ? X : (compact ? ChevronLeft : ArrowLeft)" :size="compact ? 22 : 20" />
    </button>
    <button v-else-if="toggleSidebar" type="button" class="ph-btn ph-menu" :aria-label="t('nav.menu')" @click="toggleSidebar">
      <Menu :size="20" />
    </button>
    <h1 class="ph-title" :class="{ 'ph-title-sub': back }"><slot name="title">{{ title }}</slot></h1>
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
import { inject } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ChevronLeft, X, Bell, Menu } from 'lucide-vue-next'
import { useNotificationStore } from '../stores/notifications.js'

// Intestazione di schermata del nuovo design: titolo grande per le schermate
// principali, freccia + titolo per quelle di secondo livello. Su mobile
// sostituisce la barra con il logo (che resta solo nella Home).
const props = defineProps({
  title: { type: String, default: '' },
  back: { type: [Boolean, String], default: false },   // true = indietro, stringa = rotta
  closeIcon: { type: Boolean, default: false },
  bell: { type: Boolean, default: false },
  sticky: { type: Boolean, default: false },
  compact: { type: Boolean, default: false }   // intestazione di flusso: titolo 18px, riga sotto, freccia chevron
})

const { t } = useI18n()
const router = useRouter()
const toggleSidebar = inject('toggleSidebar', null)
const notifications = useNotificationStore()

function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.page-header { @apply flex items-center gap-2 mb-3 min-h-[44px]; }
/* Fissa in alto mentre la pagina scorre: a tutta larghezza e sopra il padding superiore del main (pt-4 su mobile) */
.page-header-sticky { top: env(safe-area-inset-top); @apply max-md:sticky z-30 max-md:bg-ink max-md:-mx-4 sm:max-md:-mx-6 max-md:px-4 sm:max-md:px-6 max-md:-mt-4 max-md:pt-4 pb-2 mb-3 max-md:border-b max-md:border-border; }
/* Intestazione compatta del flusso uscita (mockup: 64px, titolo 18/800, riga sotto) */
.page-header-compact { @apply -mx-4 sm:-mx-6 -mt-6 sm:-mt-8 mb-5 px-2 gap-2 border-b border-border bg-ink; min-height: 64px; position: sticky; top: env(safe-area-inset-top); z-index: 30; }
.page-header-compact .ph-title { font-size: 18px; font-weight: 800; letter-spacing: -.02em; }
.page-header-compact .ph-back { @apply w-11 h-11 ml-0; }
.ph-title { @apply text-2xl leading-tight font-bold text-foam flex-1 min-w-0 truncate; }
.ph-title-sub { @apply text-xl; }
.ph-title:has(.tab-title-wrap) { overflow: visible; }
.ph-actions { @apply flex items-center gap-1.5 ml-auto shrink-0; }
.ph-btn {
  @apply relative flex items-center justify-center w-9 h-9 shrink-0 rounded-xl text-foam bg-surface border border-border cursor-pointer no-underline;
}
.ph-menu { @apply bg-transparent border-transparent -ml-2 w-10 md:hidden; }
.ph-back { @apply bg-transparent border-transparent -ml-2; }
.ph-dot { @apply absolute top-1 right-1 w-2 h-2 rounded-full bg-sand; }
/* Sul desktop la campanella sta già nella barra in alto. */
.ph-bell { @apply md:hidden; }
</style>

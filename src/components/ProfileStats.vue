<template>
  <nav class="profile-stats" :aria-label="t('profileStats.label')">
    <component
      :is="item.to ? RouterLink : 'div'"
      v-for="item in items"
      :key="item.key"
      v-bind="item.to ? { to: item.to, 'aria-label': t(`profileStats.${item.key}Aria`, { n: item.value }) } : {}"
      class="stat m-press m-color"
      :class="{ 'stat-static': !item.to }"
    >
      <span class="stat-value">{{ item.value ?? '–' }}</span>
      <span class="stat-label">{{ t(`profileStats.${item.key}`) }}</span>
    </component>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({
  userId:  { type: String, required: true },
  counts:  { type: Object, default: () => ({}) },
  isSelf:  { type: Boolean, default: false }
})

// Uscite: per un altro utente la lista mostra solo quelle che il server rende visibili.
// Amici: l'elenco amici di un altro utente non esiste sul server, quindi lì il numero non è un link.
const items = computed(() => [
  { key: 'sessions', value: props.counts.sessions, to: props.isSelf ? '/sessions' : { path: '/sessions', query: { user: props.userId } } },
  { key: 'friends',  value: props.counts.friends,  to: props.isSelf ? '/friends' : null },
  { key: 'catches',  value: props.counts.catches,  to: `/utenti/${props.userId}/catture` }
])
</script>

<style scoped>
.profile-stats { @apply grid grid-cols-3 gap-2 mb-4; }
.stat {
  @apply flex flex-col items-center justify-center rounded-lg bg-surface-2 border border-border/60 no-underline;
  min-height: 56px; min-width: 52px; padding: 8px 4px; color: rgb(var(--color-foam));
}
a.stat:hover { border-color: rgb(var(--color-ocean)); }
a.stat:active { background: var(--ocean-glow); }
a.stat:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.stat-static { cursor: default; }
.stat-value { font-family: var(--font-mono); font-weight: 700; font-size: 1.25rem; line-height: 1.2; }
.stat-label { @apply text-xs text-muted; }
</style>

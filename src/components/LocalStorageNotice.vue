<template>
  <div v-if="visible" class="storage-notice">
    <p>
      FishLog usa solo dati tecnici salvati nel tuo browser (accesso, tema, preferenze), nessun cookie di
      profilazione o di terze parti.
      <RouterLink to="/cookie-policy">Scopri di più</RouterLink>
    </p>
    <button type="button" class="btn btn-ghost btn-sm" @click="dismiss">Ho capito</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const STORAGE_KEY = 'fishlog_storage_notice_dismissed'

const visible = ref(!wasDismissed())

function wasDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function dismiss() {
  visible.value = false
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {}
}
</script>

<style scoped>
.storage-notice {
  @apply fixed bottom-0 inset-x-0 z-[300] flex flex-wrap items-center justify-center gap-3
         bg-surface border-t border-border px-4 py-3 text-xs text-muted shadow-[0_-4px_24px_rgba(0,0,0,0.25)];
}
.storage-notice a { @apply text-ocean hover:underline; }
</style>

<template>
  <footer class="legal-footer">
    <span class="brand icon-inline"><Fish :size="14" /> FishLog</span>
    <span class="dot">·</span>
    <RouterLink to="/privacy-policy">Privacy</RouterLink>
    <span class="dot">·</span>
    <RouterLink to="/termini">Termini</RouterLink>
    <span class="dot">·</span>
    <RouterLink to="/cookie-policy">Cookie</RouterLink>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Fish } from 'lucide-vue-next'
</script>

<style scoped>
.legal-footer {
  @apply flex flex-wrap items-center justify-center gap-2 text-xs text-muted py-3;
}
.icon-inline { @apply inline-flex items-center gap-1; }
.brand { @apply font-bold text-foam; }
.legal-footer a { @apply hover:text-ocean hover:underline; }
.dot { @apply opacity-50; }
</style>

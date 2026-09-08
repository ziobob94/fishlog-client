<template>
  <footer class="legal-footer">
    <RouterLink to="/privacy-policy">Privacy</RouterLink>
    <span class="dot">·</span>
    <RouterLink to="/termini">Termini</RouterLink>
    <span class="dot">·</span>
    <RouterLink to="/cookie-policy">Cookie</RouterLink>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.legal-footer {
  @apply flex items-center justify-center gap-2 text-xs text-muted py-3;
}
.legal-footer a { @apply hover:text-ocean hover:underline; }
.dot { @apply opacity-50; }
</style>

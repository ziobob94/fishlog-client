<template>
  <!-- Il galleggiante: mascotte per stati vuoti, caricamenti, pull-to-refresh. Fermo con prefers-reduced-motion. -->
  <svg :width="size" :height="size * 1.17" viewBox="0 0 120 140" aria-hidden="true">
    <g class="bob">
      <path d="M60 6v22" stroke="#f1f5f9" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M60 28c-17 0-26 14-26 28 0 16 12 28 26 28s26-12 26-28c0-14-9-28-26-28Z" fill="#f1f5f9" />
      <path d="M36 52c3-14 13-24 24-24s21 10 24 24Z" fill="#f59e0b" />
      <path d="M60 84v20" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6" />
    </g>
    <path d="M4 102c10 0 10 8 21 8s11-8 21 0 11 8 21 8 11-8 21 0 11 8 22 0" fill="none" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round" />
    <path d="M4 118c10 0 10 8 21 8s11-8 21 0 11 8 21 8 11-8 21 0 11 8 22 0" fill="none" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round" opacity=".4" />
  </svg>
</template>

<script setup>
defineProps({ size: { type: Number, default: 120 } })
</script>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .bob { animation: bob 2.6s ease-in-out infinite; }
}
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
</style>

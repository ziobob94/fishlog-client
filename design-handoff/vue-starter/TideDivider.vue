<template>
  <!-- Linea di marea: sostituisce .section-divider. Etichetta nello slot. -->
  <div class="tide">
    <span class="tide-label" :class="{ 'tide-sand': sand }"><slot /></span>
    <svg height="12" width="100%" aria-hidden="true">
      <defs>
        <pattern :id="pid" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6c3 0 3-4 6-4s3 4 6 4 3 4 6 4 3-4 6-4" fill="none"
                :stroke="sand ? 'rgb(var(--color-sand))' : 'rgb(var(--color-border))'"
                :stroke-opacity="sand ? 0.5 : 1" stroke-width="2" stroke-linecap="round" />
        </pattern>
      </defs>
      <rect width="100%" height="12" :fill="`url(#${pid})`" />
    </svg>
  </div>
</template>

<script>
let n = 0
</script>
<script setup>
defineProps({ sand: { type: Boolean, default: false } })
const pid = `tide-${++n}`
</script>

<style scoped>
.tide { display: flex; align-items: center; gap: 12px; }
.tide svg { flex: 1; min-width: 0; }
.tide-label { font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: rgb(var(--color-muted)); }
.tide-sand { color: rgb(var(--color-sand-text)); }
</style>

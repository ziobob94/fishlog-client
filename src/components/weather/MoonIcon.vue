<template>
  <svg viewBox="-12 -12 24 24" width="40" height="40" role="img" :aria-label="label" class="wx-moon">
    <circle r="10" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".55" />
    <path v-if="lit > 0.02" :d="d" fill="currentColor" :transform="waning ? 'scale(-1 1)' : undefined" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ phase: { type: String, default: null }, illumination: { type: Number, default: null }, label: { type: String, default: '' } })
const waning = computed(() => /calante|ultimo/.test(props.phase || ''))
const lit = computed(() => props.illumination ?? 0)
// Metà illuminata + terminatore ellittico: crescente < 50 % (si incurva a destra), gibbosa > 50 % (a sinistra).
const d = computed(() => {
  const r = 10, k = Math.abs(1 - 2 * lit.value) * r
  return `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${k.toFixed(2)} ${r} 0 0 ${lit.value > 0.5 ? 1 : 0} 0 ${-r}Z`
})
</script>

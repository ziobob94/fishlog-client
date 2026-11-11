<template>
  <figure class="wx-tide">
    <svg viewBox="0 0 320 120" class="wx-tide-svg" role="img" :aria-label="aria">
      <polyline :points="line" fill="none" stroke="rgb(var(--color-sand-text))" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle :cx="min.x" :cy="min.y" r="3.5" fill="rgb(var(--color-sand-text))" />
      <text :x="Math.min(Math.max(min.x, 24), 296)" :y="min.y + 15" text-anchor="middle" class="wx-tide-t">{{ fmt(p.min) }}</text>
      <text x="0" y="16" class="wx-tide-t">{{ fmt(hi) }}</text><text x="0" y="88" class="wx-tide-t">{{ fmt(lo) }}</text>
      <text v-for="h in [0, 6, 12, 18, 24]" :key="h" :x="X(h)" y="116" :text-anchor="h === 0 ? 'start' : h === 24 ? 'end' : 'middle'" class="wx-tide-t">{{ String(h).padStart(2, '0') }}</text>
    </svg>
  </figure>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmt } from '../../../utils/weather.js'
const props = defineProps({ p: { type: Object, required: true } })
const { t } = useI18n()
const L = 28, R = 320
const X = h => L + (h / 24) * (R - L)
const hi = computed(() => Math.ceil(Math.max(...props.p.points.map(q => q.value))) + 1)
const lo = computed(() => Math.floor(props.p.min) - 1)
const Y = v => 14 + (1 - (v - lo.value) / Math.max(hi.value - lo.value, 2)) * 74
const line = computed(() => props.p.points.map(q => `${X(q.hour + 0.5).toFixed(1)},${Y(q.value).toFixed(1)}`).join(' '))
const min = computed(() => ({ x: X(props.p.minHour + 0.5), y: Y(props.p.min) }))
const aria = computed(() => t('weather.day.pressureAria', { min: fmt(props.p.min), hour: String(props.p.minHour).padStart(2, '0') + ':00' }))
</script>

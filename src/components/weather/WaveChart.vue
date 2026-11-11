<template>
  <figure class="wx-tide">
    <svg viewBox="0 0 320 110" class="wx-tide-svg wx-wave-svg" role="img" :aria-label="aria">
      <path :d="area" fill="currentColor" fill-opacity=".14" />
      <polyline :points="line" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle :cx="peak.x" :cy="peak.y" r="3.5" fill="currentColor" />
      <text :x="Math.min(Math.max(peak.x, 22), 298)" :y="Math.max(peak.y - 8, 10)" text-anchor="middle" class="wx-tide-t">{{ fmt(series.max, 1) }} m</text>
      <text x="0" y="108" class="wx-tide-t">{{ hhmm(first?.time) }}</text>
      <text x="320" y="108" text-anchor="end" class="wx-tide-t">{{ hhmm(last?.time) }}</text>
    </svg>
    <figcaption class="wx-tide-sum"><span class="wx-muted">{{ t('weather.sea.waveMax', { h: fmt(series.max, 1), time: hhmm(series.maxTime) }) }}</span></figcaption>
  </figure>
</template>

<script setup>
// Altezza dell'onda nelle prossime 48 h (modello Open-Meteo Marine). Scala da 0 al massimo, così le onde basse restano basse.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { waveSeries, fmt, hhmm } from '../../utils/weather.js'
const props = defineProps({ waves: { type: Array, required: true } })
const { t } = useI18n()
const W = 320, H = 110, TOP = 22, BOTTOM = 14
const series = computed(() => waveSeries(props.waves))
const pts = computed(() => {
  const s = series.value; if (!s.points.length) return []
  const max = Math.max(s.max, 0.3)
  return s.points.map((p, i) => ({ x: (i / (s.points.length - 1)) * W, y: TOP + (1 - p.height / max) * (H - TOP - BOTTOM) }))
})
const line = computed(() => pts.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const area = computed(() => pts.value.length ? `M0 ${H - BOTTOM} L${pts.value.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} L${W} ${H - BOTTOM}Z` : '')
const first = computed(() => series.value.points[0])
const last = computed(() => series.value.points[series.value.points.length - 1])
const peak = computed(() => pts.value[series.value.maxIndex] || { x: 0, y: 0 })
const aria = computed(() => t('weather.sea.waveAria', { max: fmt(series.value.max, 1), time: hhmm(series.value.maxTime), first: fmt(first.value?.height, 1), last: fmt(last.value?.height, 1) }))
</script>

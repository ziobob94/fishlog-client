<template>
  <figure class="wx-tide">
    <ScrollChart :width="W" :label="aria">
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="wx-tide-svg wx-wave-svg" role="img" :aria-label="aria">
        <line v-for="d in axis.days" :key="'d' + d.x" :x1="d.x" :y1="16" :x2="d.x" :y2="H - BOTTOM" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="3 4" />
        <path :d="area" fill="currentColor" fill-opacity=".14" />
        <polyline :points="line" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <circle :cx="peak.x" :cy="peak.y" r="3.5" fill="currentColor" />
        <text :x="Math.min(Math.max(peak.x, 22), W - 22)" :y="peak.y - 8" text-anchor="middle" class="wx-tide-t">{{ fmt(series.max, 1) }} m</text>
        <text v-for="d in axis.days" :key="'l' + d.x" :x="d.x + 3" :y="11" class="wx-tide-t wx-tide-day">{{ d.label }}</text>
        <text v-for="k in axis.ticks" :key="'t' + k.x" :x="k.x" :y="H - 2" text-anchor="middle" class="wx-tide-t">{{ k.label }}</text>
      </svg>
    </ScrollChart>
    <figcaption class="wx-tide-sum"><span class="wx-muted">{{ t('weather.sea.waveMax', { h: fmt(series.max, 1), time: hhmm(series.maxTime) }) }}</span></figcaption>
  </figure>
</template>

<script setup>
// Altezza dell'onda su tutta la previsione (fino a 7 giorni), scorrevole in orizzontale. Scala da 0 al massimo, così le onde basse restano basse.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ScrollChart from './ScrollChart.vue'
import { waveSeries, fmt, hhmm, hourAxis } from '../../utils/weather.js'
const props = defineProps({ waves: { type: Array, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
const PX = 7, H = 142, TOP = 42, BOTTOM = 16
const series = computed(() => waveSeries(props.waves))
const W = computed(() => Math.max(320, (series.value.points.length - 1) * PX + 1))
const axis = computed(() => hourAxis(series.value.points.map(p => p.time), props.today, PX))
const pts = computed(() => {
  const s = series.value; if (!s.points.length) return []
  const max = Math.max(s.max, 0.3)
  return s.points.map((p, i) => ({ x: i * PX, y: TOP + (1 - p.height / max) * (H - TOP - BOTTOM) }))
})
const line = computed(() => pts.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const area = computed(() => pts.value.length ? `M0 ${H - BOTTOM} L${pts.value.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} L${pts.value[pts.value.length - 1].x} ${H - BOTTOM}Z` : '')
const first = computed(() => series.value.points[0])
const last = computed(() => series.value.points[series.value.points.length - 1])
const peak = computed(() => pts.value[series.value.maxIndex] || { x: 0, y: 0 })
const aria = computed(() => t('weather.sea.waveAria', { max: fmt(series.value.max, 1), time: hhmm(series.value.maxTime), first: fmt(first.value?.height, 1), last: fmt(last.value?.height, 1) }))
</script>

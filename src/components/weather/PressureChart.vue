<template>
  <figure class="wx-tide">
    <ScrollChart :width="W" :label="aria">
      <template #axis>
        <svg :viewBox="`0 0 34 ${H}`" width="34" :height="H" class="wx-tide-svg" style="overflow:visible">
          <text v-for="g in grid" :key="g.v" x="30" :y="g.y + 3" text-anchor="end" class="wx-tide-t">{{ g.v }}</text>
        </svg>
      </template>
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="wx-tide-svg" role="img" :aria-label="aria">
        <line v-for="g in grid" :key="'g' + g.v" x1="0" :y1="g.y" :x2="W" :y2="g.y" stroke="currentColor" stroke-opacity=".15" />
        <line v-for="d in axis.days" :key="'d' + d.x" :x1="d.x" :y1="TOP - 8" :x2="d.x" :y2="H - BOTTOM" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="3 4" />
        <polyline :points="line" fill="none" stroke="rgb(var(--color-sand-text))" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <circle :cx="pt(series.maxIndex).x" :cy="pt(series.maxIndex).y" r="3.5" fill="rgb(var(--color-sand-text))" />
        <text :x="clampX(pt(series.maxIndex).x)" :y="pt(series.maxIndex).y - 8" text-anchor="middle" class="wx-tide-t">{{ fmt(series.max) }}</text>
        <circle :cx="pt(series.minIndex).x" :cy="pt(series.minIndex).y" r="3.5" fill="rgb(var(--color-sand-text))" />
        <text :x="clampX(pt(series.minIndex).x)" :y="pt(series.minIndex).y + 15" text-anchor="middle" class="wx-tide-t">{{ fmt(series.min) }}</text>
        <text v-for="d in axis.days" :key="'l' + d.x" :x="d.x + 3" :y="TOP - 10" class="wx-tide-t wx-tide-day">{{ d.label }}</text>
        <text v-for="k in axis.ticks" :key="'t' + k.x" :x="k.x" :y="H - 2" text-anchor="middle" class="wx-tide-t">{{ k.label }}</text>
      </svg>
    </ScrollChart>
    <figcaption class="wx-tide-sum"><span class="wx-muted">{{ t('weather.pressure.rangeNote', { min: fmt(series.min), max: fmt(series.max) }) }}</span></figcaption>
  </figure>
</template>

<script setup>
// Pressione oraria (hPa) su tutta la previsione, scorrevole in orizzontale; l'asse dei valori resta fermo a sinistra.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ScrollChart from './ScrollChart.vue'
import { pressureSeries, fmt, hourAxis } from '../../utils/weather.js'
const props = defineProps({ rows: { type: Array, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
const PX = 7, H = 130, TOP = 30, BOTTOM = 16
const series = computed(() => pressureSeries(props.rows))
const W = computed(() => Math.max(280, (series.value.points.length - 1) * PX + 1))
const axis = computed(() => hourAxis(series.value.points.map(p => p.time), props.today, PX))
const lo = computed(() => Math.floor(series.value.min) - 1)
const hi = computed(() => Math.max(Math.ceil(series.value.max) + 1, lo.value + 4))
const Y = v => TOP + (1 - (v - lo.value) / (hi.value - lo.value)) * (H - TOP - BOTTOM)
const pt = i => { const p = series.value.points[i]; return p ? { x: i * PX, y: Y(p.value) } : { x: 0, y: 0 } }
const clampX = x => Math.min(Math.max(x, 14), W.value - 14)
const line = computed(() => series.value.points.map((p, i) => `${(i * PX).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' '))
const grid = computed(() => { // 3 righe a valori tondi (multipli di 5 hPa dove possibile)
  const step = Math.max(Math.ceil((hi.value - lo.value) / 3 / 5) * 5, 5)
  const out = []
  for (let v = Math.ceil(lo.value / step) * step; v <= hi.value; v += step) out.push({ v, y: Y(v) })
  return out
})
const aria = computed(() => t('weather.pressure.scrollAria', { min: fmt(series.value.min), max: fmt(series.value.max), n: series.value.points.length }))
</script>

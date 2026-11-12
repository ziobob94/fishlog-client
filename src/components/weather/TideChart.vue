<template>
  <figure class="wx-tide">
    <ScrollChart :width="W" :label="aria">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="wx-tide-svg" role="img" :aria-label="aria">
      <line v-for="d in axis.days" :key="'d' + d.x" :x1="d.x" y1="6" :x2="d.x" :y2="H - 14" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="3 4" />
      <line x1="0" :y1="zeroY" :x2="W" :y2="zeroY" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 4" />
      <path :d="area" fill="currentColor" fill-opacity=".12" />
      <polyline :points="line" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <g v-for="(e, i) in marks" :key="i">
        <circle :cx="e.x" :cy="e.y" r="3.5" fill="currentColor" />
        <text :x="Math.min(Math.max(e.x, 16), W - 16)" :y="e.type === 'alta' ? e.y - 8 : e.y + 15" text-anchor="middle" class="wx-tide-t">{{ e.hhmm }}</text>
      </g>
      <text v-for="d in axis.days" :key="'l' + d.x" :x="d.x + 3" y="12" class="wx-tide-t wx-tide-day">{{ d.label }}</text>
      <text v-for="k in axis.ticks" :key="'t' + k.x" :x="k.x" :y="H - 2" text-anchor="middle" class="wx-tide-t">{{ k.label }}</text>
    </svg>
    </ScrollChart>
    <figcaption class="wx-tide-sum">
      <span class="wx-tag">{{ t('weather.sea.estimate') }}</span>
      <ul class="wx-tide-list">
        <li v-for="e in next" :key="e.time"><span>{{ e.type === 'alta' ? t('weather.sea.high') : t('weather.sea.low') }}</span> <span class="wx-num">{{ e.hhmm }}</span> <span class="wx-num">{{ fmtSigned(e.height, 2) }} m</span></li>
      </ul>
    </figcaption>
  </figure>
</template>

<script setup>
// Maree stimate dal livello del mare del modello (fino a 7 giorni, scorrevole): linea, alte/basse con orari e riepilogo testuale delle prossime 4.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ScrollChart from './ScrollChart.vue'
import { nextTides, tideSummary, hhmm, fmtSigned, hourAxis } from '../../utils/weather.js'
const props = defineProps({ tides: { type: Object, required: true }, nowIso: { type: String, default: null }, today: { type: String, default: '' } })
const { t } = useI18n()
const PX = 7, H = 130, PAD = 24
const series = computed(() => props.tides.series || [])
const W = computed(() => Math.max(320, (series.value.length - 1) * PX + 1))
const axis = computed(() => hourAxis(series.value.map(p => p.time), props.today, PX))
const range = computed(() => {
  const hs = series.value.map(s => s.height)
  const min = Math.min(...hs, 0), max = Math.max(...hs, 0), span = Math.max(max - min, 0.2)
  return { min, max, span }
})
const xy = (i, h) => ({ x: i * PX, y: PAD + (1 - (h - range.value.min) / range.value.span) * (H - PAD - 18) })
const pts = computed(() => series.value.map((s, i) => xy(i, s.height)))
const line = computed(() => pts.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const area = computed(() => pts.value.length ? `M0 ${H - 14} L${pts.value.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} L${pts.value[pts.value.length - 1].x} ${H - 14}Z` : '')
const zeroY = computed(() => xy(0, 0).y)
const marks = computed(() => (props.tides.extremes || []).map(e => {
  const i = series.value.findIndex(s => s.time === e.time)
  return i < 0 ? null : { ...xy(i, e.height), type: e.type, hhmm: hhmm(e.time) }
}).filter(Boolean))
const next = computed(() => nextTides(props.tides, props.nowIso, 4))
const aria = computed(() => t('weather.sea.tideAria', { summary: next.value.length ? tideSummary(next.value) : t('weather.sea.noExtremes') }))
</script>

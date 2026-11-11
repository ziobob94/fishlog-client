<template>
  <figure class="wx-tide">
    <svg viewBox="0 0 320 120" class="wx-tide-svg" role="img" :aria-label="aria">
      <line x1="0" :y1="zeroY" x2="320" :y2="zeroY" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 4" />
      <path :d="area" fill="currentColor" fill-opacity=".12" />
      <polyline :points="line" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <g v-for="(e, i) in marks" :key="i">
        <circle :cx="e.x" :cy="e.y" r="3.5" fill="currentColor" />
        <text :x="e.x" :y="e.type === 'alta' ? e.y - 8 : e.y + 15" text-anchor="middle" class="wx-tide-t">{{ e.hhmm }}</text>
      </g>
    </svg>
    <figcaption class="wx-tide-sum">
      <span class="wx-tag">{{ t('weather.sea.estimate') }}</span>
      <ul class="wx-tide-list">
        <li v-for="e in next" :key="e.time"><span>{{ e.type === 'alta' ? t('weather.sea.high') : t('weather.sea.low') }}</span> <span class="wx-num">{{ e.hhmm }}</span> <span class="wx-num">{{ fmtSigned(e.height, 2) }} m</span></li>
      </ul>
    </figcaption>
  </figure>
</template>

<script setup>
// Maree stimate dal livello del mare del modello (48 h): linea, alte/basse con orari e riepilogo testuale delle prossime 4.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { nextTides, tideSummary, hhmm, fmtSigned } from '../../utils/weather.js'
const props = defineProps({ tides: { type: Object, required: true }, nowIso: { type: String, default: null } })
const { t } = useI18n()
const W = 320, H = 120, PAD = 22
const series = computed(() => props.tides.series || [])
const range = computed(() => {
  const hs = series.value.map(s => s.height)
  const min = Math.min(...hs, 0), max = Math.max(...hs, 0), span = Math.max(max - min, 0.2)
  return { min, max, span }
})
const xy = (i, h) => ({ x: (i / Math.max(series.value.length - 1, 1)) * W, y: PAD + (1 - (h - range.value.min) / range.value.span) * (H - 2 * PAD) })
const pts = computed(() => series.value.map((s, i) => xy(i, s.height)))
const line = computed(() => pts.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const area = computed(() => pts.value.length ? `M0 ${H} L${pts.value.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} L${W} ${H}Z` : '')
const zeroY = computed(() => xy(0, 0).y)
const marks = computed(() => (props.tides.extremes || []).map(e => {
  const i = series.value.findIndex(s => s.time === e.time)
  return i < 0 ? null : { ...xy(i, e.height), type: e.type, hhmm: hhmm(e.time) }
}).filter(Boolean))
const next = computed(() => nextTides(props.tides, props.nowIso, 4))
const aria = computed(() => t('weather.sea.tideAria', { summary: next.value.length ? tideSummary(next.value) : t('weather.sea.noExtremes') }))
</script>

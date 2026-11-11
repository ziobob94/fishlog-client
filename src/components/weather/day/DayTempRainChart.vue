<template>
  <figure class="wx-tide">
    <svg viewBox="0 0 320 130" class="wx-tide-svg" role="img" :aria-label="aria">
      <g v-for="b in bars" :key="b.h"><rect :x="b.x" :y="b.y" :width="b.w" :height="b.hgt" fill="rgb(var(--color-ocean-text))" fill-opacity=".55" rx="1.5" /></g>
      <line v-for="m in sunMarks" :key="m.k" :x1="m.x" y1="8" :x2="m.x" y2="106" stroke="rgb(var(--color-sand-text))" stroke-dasharray="2 3" />
      <polyline v-if="line" :points="line" fill="none" stroke="rgb(var(--color-sand-text))" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <text v-for="y in ticks" :key="y.v" x="0" :y="y.y" class="wx-tide-t">{{ y.v }}°</text>
      <text v-for="h in [0, 6, 12, 18, 24]" :key="h" :x="X(h)" y="124" :text-anchor="h === 0 ? 'start' : h === 24 ? 'end' : 'middle'" class="wx-tide-t">{{ String(h).padStart(2, '0') }}</text>
    </svg>
    <figcaption class="wx-leg"><span><i class="k k-t"></i>{{ t('weather.day.legTemp') }}</span><span><i class="k k-r"></i>{{ t('weather.day.legRain') }}</span><span><i class="k k-s"></i>{{ t('weather.day.legSun') }}</span></figcaption>
  </figure>
</template>
<script setup>
// Temperatura (linea) e pioggia in mm/h (barre) ora per ora, con alba e tramonto.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNum, fmt, hhmm } from '../../../utils/weather.js'
const props = defineProps({ rows: { type: Array, required: true }, sunrise: { type: String, default: null }, sunset: { type: String, default: null } })
const { t } = useI18n()
const L = 26, R = 320, TOP = 14, BASE = 106
const X = h => L + (h / 24) * (R - L)
const temps = computed(() => props.rows.filter(r => isNum(r.temp) && isNum(r.hour)))
const range = computed(() => { const v = temps.value.map(r => r.temp); if (!v.length) return null; const lo = Math.floor(Math.min(...v)) - 1, hi = Math.ceil(Math.max(...v)) + 1; return { lo, hi } })
const Y = v => TOP + (1 - (v - range.value.lo) / (range.value.hi - range.value.lo)) * (BASE - TOP - 24)
const line = computed(() => (range.value && temps.value.length > 1 ? temps.value.map(r => `${X(r.hour + 0.5).toFixed(1)},${Y(r.temp).toFixed(1)}`).join(' ') : ''))
const ticks = computed(() => (range.value ? [range.value.hi, range.value.lo].map(v => ({ v, y: Y(v) + 3 })) : []))
const bars = computed(() => {
  const r = props.rows.filter(x => isNum(x.precipMm) && x.precipMm > 0 && isNum(x.hour)); if (!r.length) return []
  const max = Math.max(...r.map(x => x.precipMm), 1)
  return r.map(x => { const hgt = (x.precipMm / max) * 22; return { h: x.hour, x: X(x.hour) + 1, w: (R - L) / 24 - 2, y: BASE - hgt, hgt } })
})
const sunMarks = computed(() => [['r', props.sunrise], ['s', props.sunset]].map(([k, iso]) => { const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/); return m ? { k, x: X(+m[1] + +m[2] / 60) } : null }).filter(Boolean))
const aria = computed(() => {
  const v = temps.value.map(r => r.temp)
  return t('weather.day.tempAria', { min: fmt(v.length ? Math.min(...v) : null), max: fmt(v.length ? Math.max(...v) : null), rise: hhmm(props.sunrise), set: hhmm(props.sunset) })
})
</script>
<style scoped>
.wx-leg { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .74rem; color: rgb(var(--color-muted)); margin-top: 6px; }
.wx-leg span { display: inline-flex; align-items: center; gap: 6px; }
.k { display: inline-block; width: 12px; height: 3px; border-radius: 2px; }
.k-t { background: rgb(var(--color-sand-text)); } .k-r { background: rgb(var(--color-ocean-text)); height: 8px; opacity: .6; } .k-s { border-top: 2px dashed rgb(var(--color-sand-text)); height: 0; }
</style>

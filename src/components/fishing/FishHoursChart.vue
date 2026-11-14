<template>
  <figure class="fh">
    <svg viewBox="0 0 320 104" class="fh-svg" role="img" :aria-label="aria">
      <rect v-for="b in bars" :key="b.h" :x="b.x" :y="b.y" :width="b.w" :height="b.hgt" rx="1.5" fill="rgb(var(--color-ocean-text))" :fill-opacity="b.now ? 1 : b.op" :stroke="b.now ? 'rgb(var(--color-foam))' : 'none'" stroke-width="1.5" />
      <line v-for="m in marks" :key="m.k" :x1="m.x" y1="4" :x2="m.x" y2="80" stroke="rgb(var(--color-sand-text))" stroke-dasharray="2 3" />
      <text v-for="h in [0, 6, 12, 18, 24]" :key="h" :x="X(h)" y="98" :text-anchor="h === 0 ? 'start' : h === 24 ? 'end' : 'middle'" class="fh-t">{{ String(h).padStart(2, '0') }}</text>
    </svg>
    <figcaption class="fh-leg">
      <span><i class="k k-bar"></i>{{ t('fishAct.legendBar') }}</span>
      <span><i class="k k-now"></i>{{ t('fishAct.legendNow') }}</span>
      <span><i class="k k-sun"></i>{{ t('fishAct.legendSun') }}</span>
    </figcaption>
  </figure>
</template>

<script setup>
// 24 barre (livello 1-5 per ora): l'ora corrente è piena e con contorno, alba e tramonto sono linee tratteggiate.
// Il grafico ha un testo alternativo che riassume le finestre e il livello di adesso.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { levelKey, windowsText } from '../../utils/fishActivity.js'

const props = defineProps({
  hours: { type: Array, required: true }, hour: { type: Number, default: null }, level: { type: Number, default: null },
  sunrise: { type: String, default: null }, sunset: { type: String, default: null }, windows: { type: Array, default: () => [] },
})
const { t } = useI18n()
const R = 320
const X = h => (h / 24) * R
const bars = computed(() => props.hours.filter(h => h.level != null).map(h => {
  const hgt = 6 + h.level * 12
  return { h: h.hour, x: X(h.hour) + 1, w: R / 24 - 2, hgt, y: 80 - hgt, op: 0.25 + h.level * 0.15, now: h.hour === props.hour }
}))
const marks = computed(() => [['r', props.sunrise], ['s', props.sunset]].map(([k, iso]) => { const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/); return m ? { k, x: X(+m[1] + +m[2] / 60) } : null }).filter(Boolean))
const aria = computed(() => t('fishAct.chartAria', { windows: windowsText(props.windows, t('fishAct.chartNone')), level: t(`fishAct.levels.${levelKey(props.level) || 'mid'}`).toLowerCase() }))
</script>

<style scoped>
.fh { margin: 0; }
.fh-svg { width: 100%; height: auto; display: block; }
.fh-t { font-family: var(--font-mono); font-size: 9px; fill: rgb(var(--color-muted)); }
.fh-leg { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .74rem; color: rgb(var(--color-muted)); margin-top: 6px; }
.fh-leg span { display: inline-flex; align-items: center; gap: 6px; }
.k { display: inline-block; width: 12px; height: 8px; border-radius: 2px; }
.k-bar { background: rgb(var(--color-ocean-text)); opacity: .6; }
.k-now { background: rgb(var(--color-ocean-text)); outline: 1.5px solid rgb(var(--color-foam)); outline-offset: -1px; }
.k-sun { border-top: 2px dashed rgb(var(--color-sand-text)); height: 0; }
</style>

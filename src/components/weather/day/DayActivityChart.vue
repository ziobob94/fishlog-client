<template>
  <figure class="wx-tide">
    <svg viewBox="0 0 320 100" class="wx-tide-svg" role="img" :aria-label="aria">
      <rect v-for="b in bars" :key="b.h" :x="b.x" :y="b.y" :width="b.w" :height="b.hgt" rx="1.5" fill="rgb(var(--color-ocean-text))" :fill-opacity="b.op" />
      <line v-for="m in marks" :key="m.k" :x1="m.x" y1="4" :x2="m.x" y2="80" stroke="rgb(var(--color-sand-text))" stroke-dasharray="2 3" />
      <text v-for="h in [0, 6, 12, 18, 24]" :key="h" :x="X(h)" y="96" :text-anchor="h === 0 ? 'start' : h === 24 ? 'end' : 'middle'" class="wx-tide-t">{{ String(h).padStart(2, '0') }}</text>
    </svg>
    <figcaption class="wx-leg"><span><i class="k k-r"></i>{{ t('weather.day.actLeg') }}</span><span><i class="k k-s"></i>{{ t('weather.day.legSun') }}</span></figcaption>
  </figure>
</template>
<script setup>
// Attività stimata ora per ora: altezza e opacità crescono con il livello (1-5). Il significato è nel testo accanto (finestre e livelli in parole).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ hours: { type: Array, required: true }, sunrise: { type: String, default: null }, sunset: { type: String, default: null }, label: { type: String, default: '' }, windows: { type: Array, default: () => [] } })
const { t } = useI18n()
const L = 0, R = 320
const X = h => L + (h / 24) * (R - L)
const bars = computed(() => props.hours.filter(h => h.level != null).map(h => ({ h: h.hour, x: X(h.hour) + 1, w: (R - L) / 24 - 2, hgt: 6 + h.level * 12, y: 80 - (6 + h.level * 12), op: 0.25 + h.level * 0.15, top: h.level >= 4 })))
const marks = computed(() => [['r', props.sunrise], ['s', props.sunset]].map(([k, iso]) => { const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/); return m ? { k, x: X(+m[1] + +m[2] / 60) } : null }).filter(Boolean))
const aria = computed(() => t('weather.day.actAria', { label: props.label, windows: props.windows.length ? props.windows.map(w => `${w.from}-${w.to}`).join(', ') : t('weather.day.noWindow') }))
</script>
<style scoped>
.wx-leg { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .74rem; color: rgb(var(--color-muted)); margin-top: 6px; }
.wx-leg span { display: inline-flex; align-items: center; gap: 6px; }
.k { display: inline-block; width: 12px; height: 8px; border-radius: 2px; }
.k-r { background: rgb(var(--color-ocean-text)); opacity: .6; } .k-s { border-top: 2px dashed rgb(var(--color-sand-text)); height: 0; }
</style>

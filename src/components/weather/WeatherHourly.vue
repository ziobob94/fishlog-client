<template>
  <section class="wx-block" aria-labelledby="wx-hr-h">
    <div class="wx-dy-head">
      <h2 id="wx-hr-h" class="wx-h" style="margin:0">{{ t('weather.hourly.title') }}</h2>
      <div class="wx-seg" role="radiogroup" :aria-label="t('weather.hourly.span')" @keydown="onKey">
        <button v-for="n in SPANS" :key="n" :ref="el => (btns[n] = el)" type="button" role="radio" class="m-press"
          :aria-checked="span === n" :tabindex="span === n ? 0 : -1" @click="span = n">{{ n }} h</button>
      </div>
    </div>
    <div class="wx-hours" role="region" tabindex="0" :aria-label="t('weather.hourly.regionAll', { n: span })">
      <div class="wx-hour wx-hour-lab" aria-hidden="true"><span>{{ t('weather.hourly.lHour') }}</span><span style="height:22px"></span><span>{{ t('weather.hourly.lTemp') }}</span><span style="height:45px;display:flex;align-items:center">{{ t('weather.hourly.lWind') }}</span><span>{{ t('weather.hourly.lRain') }}</span></div>
      <template v-for="it in items" :key="it.key">
        <div v-if="it.type === 'day'" class="wx-hour wx-hour-day" role="note">
          <span class="wx-hday">{{ dayLabel(it.date, today) }}</span>
          <span class="wx-num wx-hdnum">{{ it.date.slice(8) }}</span>
        </div>
        <div v-else-if="it.type === 'sunrise' || it.type === 'sunset'" class="wx-hour wx-hour-sun">
          <Sunrise v-if="it.type === 'sunrise'" :size="22" aria-hidden="true" /><Sunset v-else :size="22" aria-hidden="true" />
          <span class="wx-hsun">{{ t('weather.hourly.' + it.type) }}</span>
          <span class="wx-num" style="font-weight:700">{{ it.time }}</span>
        </div>
        <div v-else class="wx-hour" :class="{ 'wx-hour-now': it.row === firstRow }">
          <span class="wx-num">{{ String(it.row.hour).padStart(2, '0') }}:00</span>
          <WeatherIcon :code="rowWmo(it.row)" :is-day="isDayAt(it.row.hour, sunOf(it.row.date)?.sunrise, sunOf(it.row.date)?.sunset)" :size="22" /><span class="wx-sr">{{ wmoLabel(rowWmo(it.row)) }}</span>
          <span class="wx-num" style="font-weight:700">{{ fmt(it.row.temp) }}°</span>
          <WindArrow v-if="it.row.windSpeed != null" :speed="it.row.windSpeed" :deg="it.row.windDeg" class="wx-hour-wind" />
          <span class="wx-num">{{ fmt(it.row.windSpeed) }}</span>
          <span class="wx-num wx-muted">{{ fmt(it.row.precipProbability) }}%</span>
        </div>
      </template>
    </div>
    <p class="wx-note">{{ t('weather.hourly.legend') }}</p>
    <p v-if="hasExt" class="wx-note">{{ t('weather.hourly.source') }}</p>
  </section>
</template>

<script setup>
// Una sola striscia continua dall'ora corrente (24 o 48 ore), senza schede per giorno. Tra un giorno e l'altro c'è una colonna con nome e
// numero del giorno; alba e tramonto sono colonne inserite all'ora in cui avvengono (orari locali del luogo).
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sunrise, Sunset } from 'lucide-vue-next'
import WeatherIcon from '../WeatherIcon.vue'
import { wmoLabel } from '../weather-icons.js'
import WindArrow from './WindArrow.vue'
import { fmt, dayLabel, buildHourStream, rowWmo, isDayAt } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
const SPANS = [24, 48]
const span = ref(24)
const btns = {}
const items = computed(() => buildHourStream(props.view, span.value))
const firstRow = computed(() => items.value.find(i => i.type === 'hour')?.row)
const hasExt = computed(() => items.value.some(i => i.type === 'hour' && i.row.source === 'open-meteo'))
const sunOf = date => props.view.daily.find(d => d.date === date) || null
function onKey(e) {
  const i = SPANS.indexOf(span.value)
  const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? SPANS[Math.min(i + 1, SPANS.length - 1)] : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? SPANS[Math.max(i - 1, 0)] : null
  if (next == null) return
  e.preventDefault(); span.value = next; btns[next]?.focus()
}
</script>

<style scoped>
.wx-hours { gap: 0; padding: 0; margin: 0; border: 1px solid rgb(var(--color-border)); border-radius: 16px; background: rgb(var(--color-surface-2)); }
.wx-hours :deep(.wx-hour) { width: 62px; min-height: 0; border-radius: 0; background: transparent; border-right: 1px solid rgb(var(--color-border)); padding: 12px 0; gap: 7px; font-size: .8rem; }
.wx-hours :deep(.wx-hour:last-child) { border-right: 0; }
.wx-hours :deep(.wx-hour) > .wx-num, .wx-hours :deep(.wx-hour) > span { line-height: 20px; }
.wx-hours :deep(.wx-hour-lab) { align-items: center; align-content: start; }
.wx-hours :deep(.wx-hour-lab) { width: 72px; font-size: .64rem; }
.wx-hour-lab { font-weight: 800; color: rgb(var(--color-muted)); font-size: .68rem; letter-spacing: .08em; text-transform: uppercase; position: sticky; left: 0; z-index: 1; background: rgb(var(--color-surface-2)) !important; }
.wx-hour-now { background: rgb(var(--color-surface)) !important; }
.wx-hour-wind :deep(.wx-wind-tx) { display: none; }
.wx-hour-wind :deep(svg) { width: 18px; height: 18px; }
.wx-dy-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.wx-seg button[aria-checked='true'] { background: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); }
.wx-hour-day { width: 52px; align-content: center; gap: 2px; background: transparent; border: 1px dashed rgb(var(--color-border)); }
.wx-hday { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: rgb(var(--color-muted)); }
.wx-hdnum { font-size: 1.1rem; font-weight: 700; }
.wx-hour-sun { background: rgb(var(--color-surface-2)); border: 1px solid rgb(var(--color-sand-text)); color: rgb(var(--color-sand-text)); align-content: center; }
.wx-hsun { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
@media (prefers-reduced-motion: no-preference) { .wx-hour-sun { animation: wx-sun-in var(--dur-base, .24s) var(--ease-out, ease-out) both; } }
@keyframes wx-sun-in { from { opacity: 0; transform: translateY(4px); } }
</style>

<template>
  <!-- Scheda 164×112: nome, condizione, temperatura (mono), vento (freccia + km/h) e onda (assente per le località interne). -->
  <button v-if="kind !== 'add'" type="button" class="fc m-press" :class="{ 'is-active': active, 'is-partial': partial }" :aria-pressed="active ? 'true' : 'false'" :aria-label="label" @click="$emit('select')">
    <span class="fc-top">
      <span class="fc-name">{{ name }}</span>
      <Navigation v-if="kind === 'here'" :size="14" aria-hidden="true" class="fc-pin" />
      <Star v-else :size="14" fill="currentColor" aria-hidden="true" class="fc-star" />
    </span>
    <template v-if="data && !partial">
      <span class="fc-main"><WeatherIcon :code="data.wmo" :is-day="data.isDay !== false" :size="26" /><span class="fc-temp wx-num">{{ fmt(data.temp) }}°</span></span>
      <span class="fc-sub">
        <span class="fc-wind"><WindArrow v-if="data.windSpeed != null" :speed="data.windSpeed" :deg="data.windDeg" class="fc-arrow" /><span class="wx-num">{{ fmt(data.windSpeed) }}</span><small>km/h</small></span>
        <span v-if="data.hasSea" class="fc-wave"><WeatherIcon name="onda" :size="14" plain /><span class="wx-num">{{ data.waveHeight == null ? dash : fmt(data.waveHeight, 1) }}</span><small>m</small></span>
      </span>
      <span v-if="fishLevel" class="fc-fish"><FishMeter :level="fishLevel" small /><span class="fc-fish-w">{{ fishWord }}</span></span>
    </template>
    <template v-else-if="partial">
      <span class="fc-main"><span class="fc-temp wx-num">{{ dash }}</span></span>
      <span class="fc-sub"><span class="fc-none">{{ t('favorites.noData') }}</span></span>
    </template>
    <template v-else>
      <span class="m-skeleton fc-sk1" aria-hidden="true"></span><span class="m-skeleton fc-sk2" aria-hidden="true"></span>
    </template>
  </button>
  <button v-else type="button" class="fc fc-add m-press" @click="$emit('select')"><Plus :size="24" aria-hidden="true" /><span>{{ t('favorites.add') }}</span></button>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Navigation, Star, Plus } from 'lucide-vue-next'
import WeatherIcon from '../WeatherIcon.vue'
import WindArrow from '../weather/WindArrow.vue'
import FishMeter from '../fishing/FishMeter.vue'
import { levelKey, validLevel } from '../../utils/fishActivity.js'
import { wmoLabel } from '../weather-icons.js'
import '../../assets/weather.css'

const props = defineProps({
  kind: { type: String, default: 'place' },   // 'here' | 'place' | 'add'
  name: { type: String, default: '' }, data: { type: Object, default: null }, active: Boolean,
  fish: { type: Object, default: null },   // stima «adesso» di questo posto: { ok, level }
})
defineEmits(['select'])
const { t } = useI18n()
const dash = t('favorites.dash')
// Dati parziali: la scheda risponde ma senza temperatura → solo questa scheda mostra «—».
const partial = computed(() => !!props.data && (props.data.ok === false || props.data.temp == null))
const fmt = (n, d = 0) => (n == null || Number.isNaN(n) ? dash : Number(n).toFixed(d))
// Livello dei pesci solo se valido: con dati mancanti la scheda non mostra nulla al suo posto.
const fishLevel = computed(() => (props.fish?.ok ? validLevel(props.fish.level) : null))
const fishWord = computed(() => (fishLevel.value ? t(`fishAct.levels.${levelKey(fishLevel.value)}`) : ''))
const label = computed(() => {
  const d = props.data
  if (!d) return `${props.name}: ${t('weather.loading')}`
  if (partial.value) return `${props.name}: ${t('favorites.noData')}`
  const sea = d.hasSea ? `, ${t('favorites.wave', { n: d.waveHeight == null ? dash : fmt(d.waveHeight, 1) })}` : ''
  return t('favorites.cardLabel', { name: props.name, cond: (d.wmo != null && wmoLabel(d.wmo)) || d.condition || '', temp: t('favorites.temp', { n: fmt(d.temp) }), wind: t('favorites.wind', { n: fmt(d.windSpeed) }), wave: sea, fish: fishLevel.value ? t('favorites.fishPart', { level: fishWord.value.toLowerCase() }) : t('favorites.fishNone') })
})
</script>

<style scoped>
.fc { flex: none; width: 164px; min-height: 134px; overflow: hidden; scroll-snap-align: start; display: flex; flex-direction: column; justify-content: space-between; gap: 4px; padding: 10px 12px; text-align: left; font: inherit; color: rgb(var(--color-foam));
  background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); border-radius: 18px; cursor: pointer; }
.fc.is-active { border: 2px solid var(--oct, rgb(var(--color-ocean-text))); padding: 9px 11px; }
.fc:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.fc-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
.fc-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-sans); font-weight: 800; font-size: .9rem; }
.fc-star { color: rgb(var(--color-sand)); flex: none; }
.fc-pin { color: rgb(var(--color-ocean-text)); flex: none; }
.fc-main { display: flex; align-items: center; gap: 8px; }
.fc-temp { font-size: 1.6rem; font-weight: 700; line-height: 1; letter-spacing: -.02em; }
.fc :deep(.wx-wind-tx) { display: none; }
.fc-sub { white-space: nowrap; display: flex; align-items: center; gap: 10px; font-size: .8rem; color: rgb(var(--color-muted)); min-height: 20px; }
.fc-wind, .fc-wave { display: inline-flex; align-items: center; gap: 3px; }
.fc-wind small, .fc-wave small { font-size: .7rem; }
.fc-arrow :deep(svg) { width: 16px; height: 16px; }
.fc-fish { display: flex; align-items: center; gap: 6px; font-size: .78rem; font-weight: 700; color: rgb(var(--color-foam)); }
.fc-fish-w { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fc-none { font-weight: 600; }
.fc-add { align-items: center; justify-content: center; border: 2px dashed rgb(var(--color-border-light)); background: none; color: rgb(var(--color-ocean-text)); font-weight: 800; gap: 6px; }
.fc-sk1 { height: 28px; width: 70%; } .fc-sk2 { height: 16px; width: 90%; }
</style>

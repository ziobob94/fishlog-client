<template>
  <BottomSheet :model-value="modelValue" :label="title" @update:model-value="v => $emit('update:modelValue', v)">
    <div class="hd">
      <h2 class="hd-title">{{ title }}</h2>
      <template v-if="rows.length">
        <p class="hd-sub">{{ t('home.weather.detail.sub', { n: rows.length }) }} · {{ t('home.weather.detail.range', { min: fmt(lo, digits), max: fmt(hi, digits), unit }) }}</p>
        <ul class="hd-list">
          <template v-for="(r, i) in rows" :key="r.key">
            <li v-if="i === 0 || r.date !== rows[i - 1].date" class="hd-day wx-num">{{ dayLabelOf(r.date) }}</li>
            <li class="hd-row">
              <span class="wx-num hd-t">{{ String(r.hour).padStart(2, '0') }}:00</span>
              <span class="hd-bar" aria-hidden="true"><span class="hd-fill" :style="{ width: width(r.value) + '%' }" /></span>
              <span class="wx-num hd-v">{{ fmt(r.value, digits) }}<small> {{ unit }}</small></span>
              <small class="hd-x">{{ extra(r) }}</small>
            </li>
          </template>
        </ul>
      </template>
      <p v-else class="hd-sub">{{ t('home.weather.detail.empty') }}</p>
      <button type="button" class="hd-close m-press" @click="$emit('update:modelValue', false)">{{ t('home.weather.detail.close') }}</button>
    </div>
  </BottomSheet>
</template>

<script setup>
// Andamento ora per ora (prossime 48 h) di vento, pressione, onda o pioggia: stesse ore della striscia della scheda Home.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BottomSheet from '../motion/BottomSheet.vue'
import { fmt, dayLabelOf, metricRows, isNum } from '../../utils/weather.js'
import '../../assets/weather.css'

const props = defineProps({ modelValue: Boolean, metric: { type: String, default: 'wind' }, view: { type: Object, default: null } })
defineEmits(['update:modelValue'])
const { t } = useI18n()

const UNIT = { wind: 'km/h', pressure: 'hPa', wave: 'm', rain: '%' }
const unit = computed(() => UNIT[props.metric])
const digits = computed(() => (props.metric === 'wave' ? 1 : 0))
const title = computed(() => t('home.weather.detail.title', { name: t(`home.weather.detail.${props.metric}`) }))
const rows = computed(() => metricRows(props.metric, props.view))
const lo = computed(() => Math.min(...rows.value.map(r => r.value)))
const hi = computed(() => Math.max(...rows.value.map(r => r.value)))
// Barre: vento, onda e pioggia partono da zero; la pressione varia poco, quindi si scala tra minimo e massimo.
const width = v => {
  if (props.metric === 'pressure') return hi.value === lo.value ? 50 : 8 + ((v - lo.value) / (hi.value - lo.value)) * 92
  const max = props.metric === 'rain' ? 100 : Math.max(hi.value, props.metric === 'wave' ? 0.3 : 1)
  return Math.max(2, Math.min(100, (v / max) * 100))
}
function extra(r) {
  if (props.metric === 'wind') return isNum(r.extra.gust) ? t('home.weather.detail.gustShort', { n: fmt(r.extra.gust) }) : ''
  if (props.metric === 'wave') return isNum(r.extra.period) ? t('home.weather.period', { n: fmt(r.extra.period) }) : ''
  if (props.metric === 'rain') return isNum(r.extra.mm) ? t('home.weather.detail.rainMm', { mm: fmt(r.extra.mm, 1) }) : ''
  return ''
}
</script>

<style scoped>
.hd { display: grid; gap: 10px; padding-top: 4px; }
.hd-title { font-family: var(--font-display); font-size: 1.3rem; margin: 0; }
.hd-sub { margin: 0; font-size: .85rem; color: rgb(var(--color-muted)); }
.hd-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.hd-day { margin-top: 8px; font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: rgb(var(--color-ocean-text)); }
.hd-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto 64px; align-items: center; gap: 10px; min-height: 32px; font-size: .88rem; }
.hd-t { color: rgb(var(--color-muted)); font-size: .8rem; }
.hd-bar { height: 8px; border-radius: 999px; background: rgb(var(--color-surface-2)); overflow: hidden; }
.hd-fill { display: block; height: 100%; border-radius: 999px; background: rgb(var(--color-ocean-text)); }
.hd-v { font-weight: 700; text-align: right; }
.hd-v small, .hd-x { font-size: .72rem; font-weight: 400; color: rgb(var(--color-muted)); }
.hd-close { min-height: 44px; margin-top: 8px; border: 0; border-radius: 12px; background: rgb(var(--color-surface-2)); color: inherit; font: inherit; font-weight: 800; cursor: pointer; }
.hd-close:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
</style>

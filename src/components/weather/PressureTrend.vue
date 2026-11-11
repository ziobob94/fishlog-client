<template>
  <div class="wx-pt">
    <div class="wx-pt-head">
      <svg class="wx-pt-arrow" :class="{ 'wx-pt-go': go }" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" :style="{ '--rot': `${st.arrowDeg}deg` }">
        <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div>
        <p class="wx-pt-word" :class="`wx-pt-${st.key || 'none'}`">{{ word }}</p>
        <p v-if="st.delta != null" class="wx-pt-delta"><span class="wx-num">{{ fmtSigned(st.delta, 0) }}</span> hPa/3 h</p>
      </div>
    </div>
    <svg v-if="points" class="wx-pt-line" viewBox="0 0 120 36" preserveAspectRatio="none" role="img" :aria-label="t('weather.pressure.chartLabel', { n: history.length })">
      <polyline :points="points" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'wx-pt-draw': go }" />
    </svg>
    <p class="wx-pt-read">{{ st.key ? t(`weather.pressure.read.${st.key}`) : t('weather.pressure.unavailable') }}</p>
  </div>
</template>

<script setup>
// Tendenza in tre stati con parola + freccia + colore (mai solo colore) e una lettura prudente: niente «pesca buona/cattiva».
// Movimento: la freccia ruota dalla posizione «stabile» e la linea si disegna (320 ms, ritardo 200); con movimento ridotto
// freccia e linea sono già nella posizione finale.
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { pressureState, fmtSigned } from '../../utils/weather.js'
import { useReducedMotion } from '../motion/motion.js'
const props = defineProps({ trend: { type: String, default: null }, delta: { type: Number, default: null }, history: { type: Array, default: () => [] } })
const { t } = useI18n()
const st = computed(() => pressureState(props.trend, props.delta))
const word = computed(() => st.value.key ? t(`weather.pressure.${st.value.key}${st.value.strong ? 'Strong' : ''}`) : t('weather.pressure.noTrend'))
const points = computed(() => {
  const h = props.history
  if (h.length < 2) return ''
  const min = Math.min(...h), max = Math.max(...h), span = Math.max(max - min, 2)
  return h.map((v, i) => `${(i / (h.length - 1) * 120).toFixed(1)},${(32 - ((v - min) / span) * 28).toFixed(1)}`).join(' ')
})
const reduced = useReducedMotion()
const armed = ref(false)
onMounted(() => requestAnimationFrame(() => { armed.value = true }))
const go = computed(() => armed.value || reduced.value)
</script>

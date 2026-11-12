<template>
  <section class="wx-block" aria-labelledby="wx-sea-h">
    <div class="wx-head-row">
      <h2 id="wx-sea-h" class="wx-h">{{ t('weather.sea.title') }}</h2>
      <span v-if="m.available" class="wx-tag">{{ t('weather.sea.model') }}</span>
    </div>
    <template v-if="m.available">
      <dl class="wx-kv">
        <div><dt><Waves :size="16" aria-hidden="true" />{{ t('weather.sea.wave') }}</dt>
          <dd><span class="wx-num">{{ fmt(m.waveHeight, 1) }}</span> <small>m</small><br />
            <small>{{ t('weather.sea.period') }} <span class="wx-num">{{ fmt(m.wavePeriod) }}</span> s<template v-if="waveFrom"> · {{ t('weather.wind.from') }} <abbr :title="waveFrom.name">{{ waveFrom.abbr }}</abbr></template></small></dd></div>
        <div><dt><Waves :size="16" aria-hidden="true" />{{ t('weather.sea.swell') }}</dt>
          <dd><span class="wx-num">{{ fmt(m.swellHeight, 1) }}</span> <small>m</small><br />
            <small><span class="wx-num">{{ fmt(m.swellPeriod) }}</span> s<template v-if="swellFrom"> · {{ t('weather.wind.from') }} <abbr :title="swellFrom.name">{{ swellFrom.abbr }}</abbr></template></small></dd></div>
        <div><dt><Thermometer :size="16" aria-hidden="true" />{{ t('weather.sea.temp') }}</dt><dd><span class="wx-num">{{ fmt(m.seaTemp) }}</span> <small>°C</small></dd></div>
        <div v-if="m.currentSpeed != null"><dt><Navigation :size="16" aria-hidden="true" />{{ t('weather.sea.current') }}</dt>
          <dd><span class="wx-num">{{ fmt(m.currentSpeed, 1) }}</span> <small>km/h<template v-if="heading"> · {{ t('weather.sea.toward') }} {{ heading }}</template></small></dd></div>
      </dl>
      <template v-if="waves.points.length">
        <h3 class="wx-h" style="font-size:1rem;margin:16px 0 6px">{{ t('weather.sea.waves') }}</h3>
        <WaveChart :waves="waves48" />
      </template>
      <template v-if="m.tides">
        <h3 class="wx-h" style="font-size:1rem;margin:16px 0 6px">{{ t('weather.sea.tides') }}</h3>
        <TideChart :tides="tides48" :now-iso="nowIso" />
        <p class="wx-note">{{ t('weather.sea.tideNote') }}</p>
      </template>
      <p v-else class="wx-note">{{ t('weather.sea.noTides') }}</p>
    </template>
    <p v-else class="wx-muted" style="margin:0">{{ t('weather.sea.none') }}</p>
  </section>
</template>

<script setup>
// Senza dati mare (lago, fiume, entroterra) il blocco diventa una riga neutra: il resto della pagina resta completo.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Waves, Thermometer, Navigation } from 'lucide-vue-next'
import TideChart from './TideChart.vue'
import WaveChart from './WaveChart.vue'
import { fmt, compass, waveSeries, fromNow } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true }, nowIso: { type: String, default: null } })
const { t } = useI18n()
const m = computed(() => props.view.marine)
const waves48 = computed(() => fromNow(m.value.waves, props.nowIso, 48))
const waves = computed(() => waveSeries(waves48.value))
const tides48 = computed(() => {
  const t = m.value.tides; if (!t) return null
  const series = fromNow(t.series, props.nowIso, 48)
  const a = series[0]?.time, b = series[series.length - 1]?.time
  return { ...t, series, extremes: (t.extremes || []).filter(e => e.time >= a && e.time <= b) }
})
const waveFrom = computed(() => compass(m.value.waveDeg))
const swellFrom = computed(() => compass(m.value.swellDeg))
// La corrente si indica verso dove va (convenzione oceanografica): 180° = «verso S».
const heading = computed(() => compass(m.value.currentDeg)?.abbr ?? null)
</script>

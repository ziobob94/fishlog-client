<template>
  <section class="wx-block" aria-labelledby="wx-now-h">
    <h2 id="wx-now-h" class="wx-h">{{ t('weather.now.title') }}</h2>
    <div class="wx-now-top">
      <WeatherIcon :condition="c.condition" :is-day="c.isDay !== false" :size="44" class="wx-ocean" />
      <div>
        <p class="wx-big" :aria-label="c.temp == null ? t('weather.missing') : undefined">{{ fmt(c.temp) }}<span class="wx-unit">°C</span></p>
        <p class="wx-sub" style="margin:4px 0 0">{{ conditionText(c.condition, c.description) }} · {{ t('weather.now.feels') }} <span class="wx-num">{{ fmt(c.feelsLike) }}°</span></p>
      </div>
    </div>
    <dl class="wx-kv" style="margin-top:14px">
      <div><dt>{{ t('weather.now.wind') }}</dt>
        <dd><span class="wx-num">{{ fmt(c.windSpeed) }}</span> <small>km/h</small>
          <small v-if="c.windGust != null"> · {{ t('weather.now.gust') }} <span class="wx-num">{{ fmt(c.windGust) }}</span></small><br />
          <WindArrow :speed="c.windSpeed" :deg="c.windDeg" /></dd></div>
      <div><dt>{{ t('weather.now.pressure') }}</dt>
        <dd><span class="wx-num">{{ fmt(c.pressure) }}</span> <small>hPa</small><br />
          <small v-if="trendWord">{{ trendWord }}<template v-if="f.pressure.delta3h != null"> · <span class="wx-num">{{ fmtSigned(f.pressure.delta3h, 0) }}</span> hPa/3 h</template></small></dd></div>
      <div><dt>{{ t('weather.now.humidity') }}</dt><dd><span class="wx-num">{{ fmt(c.humidity) }}</span> <small>%</small></dd></div>
      <div><dt>{{ t('weather.now.rain') }}</dt>
        <dd><span class="wx-num">{{ fmt(c.precipProbability) }}</span> <small>% {{ t('weather.now.expected') }}</small><br />
          <small><span class="wx-num">{{ fmt(c.precipMm, 1) }}</span> mm</small></dd></div>
      <div><dt>{{ t('weather.now.uv') }}</dt><dd><span class="wx-num">{{ fmt(c.uvIndex) }}</span> <small v-if="uv">{{ uv }}</small></dd></div>
      <div><dt>{{ t('weather.now.clouds') }}</dt><dd><span class="wx-num">{{ fmt(c.cloudCover) }}</span> <small>% {{ t('weather.now.cover') }}</small></dd></div>
    </dl>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WeatherIcon from './WeatherIcon.vue'
import WindArrow from './WindArrow.vue'
import { fmt, fmtSigned, conditionText, uvLabel, pressureState } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true } })
const { t } = useI18n()
const c = computed(() => props.view.current)
const f = computed(() => props.view.fishing)
const uv = computed(() => uvLabel(c.value.uvIndex))
const trendWord = computed(() => { const k = pressureState(f.value.pressure.trend, f.value.pressure.delta3h).key; return k ? t(`weather.pressure.${k}`) : null })
</script>

<style scoped>
.wx-now-top { display: flex; align-items: center; gap: 14px; }
.wx-ocean { color: rgb(var(--color-ocean-text)); flex: none; }
</style>

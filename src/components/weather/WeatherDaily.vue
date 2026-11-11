<template>
  <section class="wx-block" aria-labelledby="wx-dy-h">
    <h2 id="wx-dy-h" class="wx-h">{{ t('weather.daily.title') }}</h2>
    <div style="overflow-x:auto">
      <table class="wx-days">
        <caption class="wx-sr">{{ t('weather.daily.title') }}</caption>
        <thead>
          <tr><th scope="col">{{ t('weather.daily.day') }}</th><th scope="col">{{ t('weather.daily.sky') }}</th><th scope="col">{{ t('weather.daily.temp') }}</th><th scope="col">{{ t('weather.daily.wind') }}</th><th scope="col">{{ t('weather.daily.rain') }}</th><th v-if="view.marine.available" scope="col">{{ t('weather.daily.wave') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="d in view.daily" :key="d.date">
            <td>{{ dayLabel(d.date, today) }}</td>
            <td><span class="wx-cond"><WeatherIcon :condition="d.condition" :size="20" /> <span class="wx-muted wx-cond-t">{{ conditionLabel(d.condition) }}</span><span class="wx-sr">{{ conditionLabel(d.condition) }}</span></span></td>
            <td><span class="wx-num">{{ fmt(d.tempMax) }}°</span> <span class="wx-num wx-muted">{{ fmt(d.tempMin) }}°</span></td>
            <td><span class="wx-num">{{ fmt(d.windSpeed) }}</span> <small class="wx-muted">km/h</small></td>
            <td><span class="wx-num">{{ fmt(d.precipProbability) }}</span><small class="wx-muted">%</small></td>
            <td v-if="view.marine.available"><span class="wx-num">{{ fmt(d.waveHeightMax, 1) }}</span> <small class="wx-muted">m</small></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import WeatherIcon from './WeatherIcon.vue'
import { fmt, dayLabel, conditionLabel } from '../../utils/weather.js'
defineProps({ view: { type: Object, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
</script>

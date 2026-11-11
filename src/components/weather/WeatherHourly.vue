<template>
  <section class="wx-block" aria-labelledby="wx-hr-h">
    <div class="wx-bar-row" style="margin-bottom:8px">
      <h2 id="wx-hr-h" class="wx-h" style="margin:0">{{ t('weather.hourly.title') }}</h2>
      <div class="wx-seg" role="group" :aria-label="t('weather.hourly.range')">
        <span class="wx-seg-ind" aria-hidden="true" :style="{ width: 'calc(50% - 3px)', transform: span === 48 ? 'translateX(100%)' : 'none' }" />
        <button type="button" :aria-pressed="span === 24" @click="span = 24">24 h</button>
        <button type="button" :aria-pressed="span === 48" @click="span = 48">48 h</button>
      </div>
    </div>
    <div class="wx-hours" role="region" tabindex="0" :aria-label="t('weather.hourly.region')">
      <div v-for="(h, i) in rows" :key="h.time || i" class="wx-hour">
        <span class="wx-num">{{ h.hour == null ? MISSING : String(h.hour).padStart(2, '0') + ':00' }}</span>
        <WeatherIcon :condition="h.condition" :size="22" />
        <span class="wx-num" style="font-weight:700">{{ fmt(h.temp) }}°</span>
        <WindArrow v-if="h.windSpeed != null" :speed="h.windSpeed" :deg="h.windDeg" class="wx-hour-wind" />
        <span class="wx-num">{{ fmt(h.windSpeed) }}</span>
        <span class="wx-num wx-muted">{{ fmt(h.precipProbability) }}%</span>
      </div>
    </div>
    <p class="wx-note">{{ t('weather.hourly.legend') }}</p>
  </section>
</template>

<script setup>
// Scorrimento orizzontale, raggiungibile da tastiera (frecce con la regione a fuoco).
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WeatherIcon from './WeatherIcon.vue'
import WindArrow from './WindArrow.vue'
import { fmt, MISSING } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true } })
const { t } = useI18n()
const span = ref(24)
const rows = computed(() => props.view.hourly.slice(0, span.value))
</script>

<style scoped>
.wx-hour-wind :deep(.wx-wind-tx) { display: none; }
.wx-hour-wind :deep(svg) { width: 18px; height: 18px; }
</style>

<template>
  <section v-if="has" class="wx-block" aria-labelledby="wx-pr-h">
    <h2 id="wx-pr-h" class="wx-h">{{ t('weather.pressure.title') }}</h2>
    <PressureChart :rows="view.hourly" :today="today" />
    <p class="wx-note">{{ t('weather.pressure.scrollHint') }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PressureChart from './PressureChart.vue'
import { pressureSeries } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
const has = computed(() => pressureSeries(props.view.hourly).points.length >= 2)
</script>

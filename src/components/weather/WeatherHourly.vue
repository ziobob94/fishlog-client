<template>
  <section class="wx-block" aria-labelledby="wx-hr-h">
    <h2 id="wx-hr-h" class="wx-h">{{ t('weather.hourly.title') }}</h2>
    <div class="wx-chips wx-daychips" role="group" :aria-label="t('weather.hourly.days')">
      <button v-for="(d, i) in days" :key="d.date" type="button" class="wx-chip m-color" :aria-pressed="sel === i" :class="{ 'wx-chip-on': sel === i }" @click="sel = i">
        {{ dayLabel(d.date, today) }}<span class="wx-num wx-chip-n"> {{ d.date.slice(8) }}</span>
      </button>
    </div>
    <div ref="strip" class="wx-hours" role="region" tabindex="0" :aria-label="t('weather.hourly.region', { day: dayLabel(day?.date, today) })">
      <template v-for="(h, i) in rows" :key="h.time || i">
        <div v-if="i === extIdx && i > 0" class="wx-hour wx-hour-src" role="note"><span>{{ t('weather.hourly.fromOm') }}</span></div>
        <div class="wx-hour">
          <span class="wx-num">{{ h.hour == null ? MISSING : String(h.hour).padStart(2, '0') + ':00' }}</span>
          <WeatherIcon :condition="h.condition" :size="22" />
          <span class="wx-num" style="font-weight:700">{{ fmt(h.temp) }}°</span>
          <WindArrow v-if="h.windSpeed != null" :speed="h.windSpeed" :deg="h.windDeg" class="wx-hour-wind" />
          <span class="wx-num">{{ fmt(h.windSpeed) }}</span>
          <span class="wx-num wx-muted">{{ fmt(h.precipProbability) }}%</span>
        </div>
      </template>
    </div>
    <p class="wx-note">{{ t('weather.hourly.legend') }}</p>
    <p v-if="day?.extended" class="wx-note">{{ t('weather.hourly.source') }}</p>
  </section>
</template>

<script setup>
// Un giorno alla volta (fino a 7), con scorrimento orizzontale da tastiera. Le prime 48 ore vengono da Google, le successive da Open-Meteo:
// la fonte è dichiarata sul giorno e con un separatore nella striscia.
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import WeatherIcon from './WeatherIcon.vue'
import WindArrow from './WindArrow.vue'
import { fmt, MISSING, dayLabel, groupHoursByDay, firstExtendedIndex } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
const sel = ref(0)
const strip = ref(null)
const days = computed(() => groupHoursByDay(props.view.hourly).slice(0, 7))
const day = computed(() => days.value[Math.min(sel.value, days.value.length - 1)])
const rows = computed(() => day.value?.rows || [])
const extIdx = computed(() => firstExtendedIndex(rows.value))
watch(sel, async () => { await nextTick(); if (strip.value) strip.value.scrollLeft = 0 })
watch(() => props.view, () => { if (sel.value >= days.value.length) sel.value = 0 })
</script>

<style scoped>
.wx-hour-wind :deep(.wx-wind-tx) { display: none; }
.wx-hour-wind :deep(svg) { width: 18px; height: 18px; }
.wx-daychips { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 8px; margin-bottom: 4px; }
.wx-daychips .wx-chip { flex: none; }
.wx-chip-on { background: rgb(var(--color-ocean)); border-color: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); }
.wx-chip-n { opacity: .75; font-size: .75rem; }
.wx-hour-src { width: 92px; align-content: center; font-size: .7rem; color: rgb(var(--color-muted)); background: transparent; border: 1px dashed rgb(var(--color-border)); }
</style>

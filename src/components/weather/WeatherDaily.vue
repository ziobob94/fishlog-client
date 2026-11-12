<template>
  <section class="wx-block" aria-labelledby="wx-dy-h">
    <div class="wx-dy-head">
      <h2 id="wx-dy-h" class="wx-h" style="margin:0">{{ t('weather.daily.titleN') }}</h2>
      <div class="wx-seg" role="radiogroup" :aria-label="t('weather.daily.choose')" @keydown="onKey">
        <button v-for="n in DAY_CHOICES" :key="n" :ref="el => (btns[n] = el)" type="button" role="radio" class="m-press"
          :aria-checked="days === n" :tabindex="days === n ? 0 : -1" :aria-pressed="days === n" @click="pick(n)">{{ n }} {{ t('weather.daily.daysShort') }}</button>
      </div>
    </div>

    <!-- Riepilogo del periodo scelto -->
    <div class="wx-sum" role="group" :aria-label="t('weather.daily.summary', { n: days })">
      <dl class="wx-kv wx-sum-kv">
        <div><dt>{{ t('weather.daily.temps') }}</dt><dd><span class="wx-num">{{ fmt(sum.tempMin) }}°</span> / <span class="wx-num">{{ fmt(sum.tempMax) }}°</span></dd></div>
        <div><dt>{{ t('weather.daily.rainTotal') }}</dt><dd><span class="wx-num">{{ fmt(sum.rainTotal, 1) }}</span> <small>mm</small><br /><small>{{ sum.rainDays == null ? '' : t('weather.daily.rainDays', { n: sum.rainDays }, sum.rainDays) }}<template v-if="sum.rainPartial"> · {{ t('weather.daily.partialSum') }}</template></small></dd></div>
        <div><dt>{{ t('weather.daily.windMax') }}</dt><dd><span class="wx-num">{{ fmt(sum.windMax) }}</span> <small>km/h</small></dd></div>
        <div v-if="view.marine.available"><dt>{{ t('weather.daily.waveMax') }}</dt><dd><span class="wx-num">{{ fmt(sum.waveMax, 1) }}</span> <small>m</small><br /><small v-if="days > LESS_RELIABLE_FROM">{{ t('weather.daily.first7') }}</small></dd></div>
      </dl>
    </div>

    <ol class="wx-dlist">
      <template v-for="(d, i) in rows" :key="d.date">
        <li v-if="i === LESS_RELIABLE_FROM" class="wx-dsplit" role="separator" aria-orientation="horizontal"><span>{{ t('weather.daily.lessReliable') }}</span></li>
        <li>
          <RouterLink :to="{ name: 'weather-day', params: { date: d.date } }" class="wx-drow m-press">
            <WeatherIcon :code="rowWmo(d)" :size="30" class="wx-dicon" />
            <span class="wx-dmain">
              <span class="wx-dday">{{ dayLabel(d.date, today) }} <span class="wx-num">{{ d.date ? d.date.slice(8) : '' }}</span> <span class="wx-dcond">· {{ wmoLabel(rowWmo(d)) }}</span></span>
              <span class="wx-dmeta">
                <span><span class="wx-num">{{ fmt(d.windSpeed) }}</span> km/h</span>
                <span class="wx-dsky"><span class="wx-num">{{ fmt(d.precipProbability) }}%</span> · <span class="wx-num">{{ fmt(d.precipSum, 1) }}</span> mm</span>
                <span v-if="view.marine.available && d.waveHeightMax != null" class="wx-dwave2"><Waves :size="14" aria-hidden="true" /> <span class="wx-num">{{ fmt(d.waveHeightMax, 1) }}</span> m</span>
              </span>
              <span v-if="d.sunrise || d.sunset" class="wx-dsun"><Sunrise :size="16" aria-hidden="true" /><span class="wx-sr">{{ t('weather.hourly.sunrise') }}</span> <span class="wx-num">{{ hhmm(d.sunrise) }}</span> <Sunset :size="16" aria-hidden="true" /><span class="wx-sr">{{ t('weather.hourly.sunset') }}</span> <span class="wx-num">{{ hhmm(d.sunset) }}</span></span>
            </span>
            <span class="wx-dtemp"><span class="wx-num">{{ fmt(d.tempMin) }}°</span> / <span class="wx-num">{{ fmt(d.tempMax) }}°</span></span>
            <ChevronRight :size="18" aria-hidden="true" class="wx-dgo" />
          </RouterLink>
        </li>
      </template>
    </ol>
    <p class="wx-note">{{ t('weather.daily.note') }}</p>
    <p v-if="days > LESS_RELIABLE_FROM" class="wx-note">{{ t('weather.daily.source') }}</p>
  </section>
</template>

<script setup>
// «Prossimi giorni»: selettore 7 / 15 giorni (si ricorda in localStorage), riepilogo del periodo e lista. Ogni giorno apre il dettaglio.
// Dal giorno 8 compare il divisore «meno affidabile»: onda e attività dei pesci non ci sono e si mostra «—».
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Sunrise, Sunset, Waves } from 'lucide-vue-next'
import WeatherIcon from '../WeatherIcon.vue'
import { wmoLabel } from '../weather-icons.js'
import { fmt, hhmm, dayLabel, rowWmo, periodSummary, readDays, saveDays, DAY_CHOICES, LESS_RELIABLE_FROM } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
const days = ref(readDays())
const btns = {}
const rows = computed(() => props.view.daily.slice(0, days.value))
const sum = computed(() => periodSummary(props.view.daily, days.value))
function pick(n) { days.value = n; saveDays(n) }
function onKey(e) {
  const i = DAY_CHOICES.indexOf(days.value)
  const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? DAY_CHOICES[Math.min(i + 1, DAY_CHOICES.length - 1)] : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? DAY_CHOICES[Math.max(i - 1, 0)] : null
  if (next == null) return
  e.preventDefault(); pick(next); btns[next]?.focus()
}
</script>

<style scoped>
.wx-seg button[aria-checked='true'] { background: rgb(var(--color-ocean)); color: rgb(var(--color-on-primary)); }
.wx-dy-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.wx-sum { background: rgb(var(--color-surface-2)); border-radius: 14px; padding: 12px 14px; margin-bottom: 8px; }
.wx-sum-kv { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
.wx-dlist { list-style: none; margin: 0; padding: 0; }
.wx-drow { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto 20px; align-items: center; gap: 10px; min-height: 64px; padding: 10px 0; border-top: 1px solid rgb(var(--color-border)); color: inherit; text-decoration: none; }
.wx-dicon { color: rgb(var(--color-sand-text)); }
.wx-dmain { display: grid; gap: 3px; min-width: 0; }
.wx-dday { font-weight: 800; font-size: .95rem; }
.wx-dcond { font-weight: 500; font-size: .8rem; color: rgb(var(--color-muted)); }
.wx-dmeta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: .78rem; color: rgb(var(--color-muted)); }
.wx-dsky { color: rgb(var(--color-ocean-text)); }
.wx-dwave2 { display: inline-flex; align-items: center; gap: 3px; }
.wx-dsun { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; color: rgb(var(--color-sand-text)); }
.wx-dtemp { font-size: .95rem; font-weight: 700; white-space: nowrap; }
.wx-dgo { color: rgb(var(--color-muted)); }
.wx-dsplit { display: flex; align-items: center; gap: 10px; margin: 8px 0; font-size: .74rem; font-weight: 700; color: rgb(var(--color-muted)); text-transform: uppercase; letter-spacing: .05em; }
.wx-dsplit + li .wx-drow { border-top: 0; }
.wx-dsplit::before, .wx-dsplit::after { content: ''; flex: 1; border-top: 2px dashed rgb(var(--color-border)); }
</style>

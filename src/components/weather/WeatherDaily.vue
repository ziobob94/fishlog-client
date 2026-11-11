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
            <span class="wx-dday">{{ dayLabel(d.date, today) }} <span class="wx-num wx-muted">{{ d.date ? d.date.slice(8) : '' }}</span></span>
            <span class="wx-cond"><WeatherIcon :code="rowWmo(d)" :size="24" /><span class="wx-dcond">{{ wmoLabel(rowWmo(d)) }}</span></span>
            <span class="wx-dtemp"><span class="wx-num">{{ fmt(d.tempMax) }}°</span> <span class="wx-num wx-muted">{{ fmt(d.tempMin) }}°</span></span>
            <span class="wx-dbar" aria-hidden="true"><i v-if="bars[i]" :style="{ left: bars[i].from + '%', width: Math.max(bars[i].to - bars[i].from, 4) + '%' }"></i></span>
            <span class="wx-drain"><span class="wx-num">{{ fmt(d.precipProbability) }}</span><small class="wx-muted">%</small></span>
            <span class="wx-dwind"><span class="wx-num">{{ fmt(d.windSpeed) }}</span> <small class="wx-muted">km/h</small></span>
            <span v-if="view.marine.available" class="wx-dwave"><span class="wx-num">{{ fmt(d.waveHeightMax, 1) }}</span> <small class="wx-muted">m</small></span>
            <span class="wx-dact">
              <template v-if="d.activity"><Fish :size="16" aria-hidden="true" /> {{ d.activity.label }}</template>
              <template v-else><span class="wx-dash" :aria-label="t('weather.missing')">—</span></template>
            </span>
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
import { ChevronRight, Fish } from 'lucide-vue-next'
import WeatherIcon from '../WeatherIcon.vue'
import { wmoLabel } from '../weather-icons.js'
import { fmt, dayLabel, rowWmo, periodSummary, tempBars, readDays, saveDays, DAY_CHOICES, LESS_RELIABLE_FROM } from '../../utils/weather.js'
const props = defineProps({ view: { type: Object, required: true }, today: { type: String, default: '' } })
const { t } = useI18n()
const days = ref(readDays())
const btns = {}
const rows = computed(() => props.view.daily.slice(0, days.value))
const sum = computed(() => periodSummary(props.view.daily, days.value))
const bars = computed(() => tempBars(props.view.daily, days.value))
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
.wx-drow { display: grid; grid-template-columns: 72px minmax(0, 1.4fr) 72px minmax(40px, .8fr) 44px 74px auto 24px; align-items: center; gap: 8px; min-height: 52px; padding: 6px 4px; border-top: 1px solid rgb(var(--color-border)); color: inherit; text-decoration: none; font-size: .9rem; }
.wx-dday { font-weight: 700; }
.wx-dcond { color: rgb(var(--color-muted)); font-size: .82rem; }
.wx-dbar { position: relative; height: 6px; border-radius: 3px; background: rgb(var(--color-border)); }
.wx-dbar i { position: absolute; top: 0; bottom: 0; border-radius: 3px; background: rgb(var(--color-sand-text)); }
.wx-dact { font-size: .8rem; display: inline-flex; align-items: center; gap: 4px; color: rgb(var(--color-foam)); white-space: nowrap; }
.wx-dgo { color: rgb(var(--color-muted)); }
.wx-dsplit { display: flex; align-items: center; gap: 10px; margin: 8px 0; font-size: .74rem; font-weight: 700; color: rgb(var(--color-muted)); text-transform: uppercase; letter-spacing: .05em; }
.wx-dsplit::before, .wx-dsplit::after { content: ''; flex: 1; border-top: 2px dashed rgb(var(--color-border)); }
@media (max-width: 700px) {
  .wx-drow { grid-template-columns: 64px minmax(0, 1fr) 70px 24px; grid-template-areas: 'day cond temp go' 'bar bar rain rain' 'act act act act'; row-gap: 4px; }
  .wx-dday { grid-area: day; } .wx-cond { grid-area: cond; } .wx-dtemp { grid-area: temp; } .wx-dgo { grid-area: go; }
  .wx-dbar { grid-area: bar; } .wx-drain { grid-area: rain; } .wx-dact { grid-area: act; }
  .wx-dwind, .wx-dwave { display: none; }
}
</style>

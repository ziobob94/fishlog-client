<template>
  <div class="wx-page">
    <PageHeader :title="title" back="/meteo" />

    <!-- Stati senza dettaglio -->
    <section v-if="state === 'loading'" aria-live="polite"><WeatherSkeleton /></section>

    <section v-else-if="state === 'offline'" class="wx-block wx-state" role="status">
      <WifiOff :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.day.offlineTitle') }}</h2><p>{{ t('weather.day.offlineText') }}</p>
      <RouterLink to="/meteo" class="fl-btn1 m-press">{{ t('weather.day.backToDays') }}</RouterLink>
    </section>

    <section v-else-if="state === 'error'" class="wx-block wx-state" role="alert">
      <CloudOff :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.day.errorTitle') }}</h2><p>{{ t('weather.error.text') }}</p>
      <button type="button" class="fl-btn1 m-press" @click="reload">{{ t('weather.retry') }}</button>
    </section>

    <section v-else-if="state === 'noplace'" class="wx-block wx-state">
      <MapPin :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.noPlace.title') }}</h2>
      <RouterLink to="/meteo" class="fl-btn1 m-press">{{ t('weather.day.backToDays') }}</RouterLink>
    </section>

    <section v-else-if="state === 'outside'" class="wx-block wx-state" role="status">
      <CalendarX :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.day.outsideTitle') }}</h2><p>{{ t('weather.day.outsideText') }}</p>
      <RouterLink to="/meteo" class="fl-btn1 m-press">{{ t('weather.day.backToDays') }}</RouterLink>
    </section>

    <template v-else-if="day">
      <div class="wx-day-nav">
        <div class="wx-day-place"><p class="wx-upd" style="margin:0">{{ place }}<template v-if="updated"> · {{ t('weather.updatedAt') }} <span class="wx-num">{{ updated }}</span></template></p></div>
        <DayNav :prev="prev" :next="next" />
      </div>
      <div v-if="offline" class="wx-banner" role="status"><WifiOff :size="18" aria-hidden="true" style="flex:none;margin-top:2px" />
        <span><b>{{ t('weather.day.offlineBanner') }}</b> {{ t('weather.day.savedAt', { time: updated }) }}</span></div>

      <StaggerList class="wx-page">
        <!-- Riepilogo -->
        <section :style="{ '--i': 0 }" class="wx-block" aria-labelledby="dy-sum">
          <div class="wx-dy-top"><h2 id="dy-sum" class="wx-h" style="margin:0">{{ t('weather.day.summary') }}</h2>
            <span class="wx-tag" :class="`wx-rel-${rel}`">{{ t(`weather.day.rel.${rel}`) }}</span></div>
          <div class="wx-now-top" style="margin:10px 0 12px">
            <WeatherIcon :code="rowWmo(day)" :size="56" class="wx-ocean" />
            <div><p class="wx-big">{{ fmt(day.tempMax) }}°<span class="wx-unit"> / {{ fmt(day.tempMin) }}°</span></p>
              <p class="wx-sub" style="margin:4px 0 0">{{ wmoLabel(rowWmo(day)) }} · {{ t('weather.day.inDays', { n: index }, index) }}</p></div>
          </div>
          <dl class="wx-kv">
            <div><dt><WeatherIcon name="vento" :size="16" plain /> {{ t('weather.now.wind') }}</dt>
              <dd><span class="wx-num">{{ fmt(day.windSpeed) }}</span> <small>km/h</small><br /><small>{{ t('weather.now.gust') }} <span class="wx-num">{{ fmt(day.windGust) }}</span> km/h<template v-if="windFrom"> · {{ t('weather.wind.from') }} <abbr :title="windFrom.name">{{ windFrom.abbr }}</abbr></template></small></dd></div>
            <div><dt><WeatherIcon name="pioggia-prob" :size="16" plain /> {{ t('weather.now.rain') }}</dt>
              <dd><span class="wx-num">{{ fmt(day.precipProbability) }}</span> <small>%</small><br /><small>{{ t('weather.now.expected') }} <span class="wx-num">{{ fmt(day.precipSum, 1) }}</span> mm</small></dd></div>
            <div><dt><WeatherIcon name="alba" :size="16" plain /> {{ t('weather.day.sun') }}</dt>
              <dd><template v-if="light"><span class="wx-num">{{ light.hours }}</span> <small>h</small> <span class="wx-num">{{ String(light.minutes).padStart(2, '0') }}</span> <small>min</small></template><template v-else><span class="wx-dash" :aria-label="t('weather.missing')">—</span></template><br /><small>{{ t('weather.day.ofLight') }}</small></dd></div>
          </dl>
        </section>

        <!-- Fasce -->
        <section v-if="detailed" :style="{ '--i': 1 }" class="wx-block" aria-labelledby="dy-bands">
          <h2 id="dy-bands" class="wx-h">{{ t('weather.day.bands') }}</h2>
          <ul class="wx-bands">
            <li v-for="b in bands" :key="b.key" class="wx-band">
              <div class="wx-band-h"><span class="wx-cond"><WeatherIcon :code="b.wmo" :is-day="!b.isNight" :size="22" /> <b>{{ t(`weather.day.band.${b.key}`) }}</b></span><span class="wx-num wx-muted">{{ String(b.from).padStart(2, '0') }}–{{ String(b.to).padStart(2, '0') }}</span></div>
              <dl class="wx-band-kv">
                <div><dt>{{ t('weather.day.tempShort') }}</dt><dd class="wx-num">{{ fmt(b.temp) }}°</dd></div>
                <div><dt>{{ t('weather.now.wind') }}</dt><dd class="wx-num">{{ fmt(b.wind) }}</dd></div>
                <div><dt>{{ t('weather.now.rain') }}</dt><dd class="wx-num">{{ fmt(b.rain) }}%</dd></div>
                <div v-if="view.marine.available"><dt>{{ t('weather.sea.wave') }}</dt><dd class="wx-num">{{ fmt(b.wave, 1) }}</dd></div>
              </dl>
            </li>
          </ul>
          <p class="wx-note">{{ t('weather.day.bandsNote') }}</p>
        </section>

        <!-- Temperatura e pioggia -->
        <section :style="{ '--i': 2 }" class="wx-block" aria-labelledby="dy-temp">
          <h2 id="dy-temp" class="wx-h">{{ t('weather.day.tempRain') }}</h2>
          <DayTempRainChart v-if="detailed" :rows="rows" :sunrise="day.sunrise" :sunset="day.sunset" />
          <p v-else class="wx-info"><Info :size="16" aria-hidden="true" /> {{ t('weather.day.only7') }}</p>
        </section>

        <!-- Pressione -->
        <section :style="{ '--i': 3 }" class="wx-block" aria-labelledby="dy-pr">
          <h2 id="dy-pr" class="wx-h">{{ t('weather.day.pressure') }}</h2>
          <template v-if="detailed && press">
            <p class="wx-pt-word wx-pt-falling" v-if="press.shape === 'fallRise'">{{ t('weather.day.press.fallRise') }}</p>
            <p class="wx-pt-word" v-else>{{ t(`weather.day.press.${press.shape}`) }}</p>
            <DayPressureChart :p="press" />
            <p class="wx-note"><Info :size="14" aria-hidden="true" style="vertical-align:-2px" /> {{ t('weather.day.pressRead', { min: fmt(press.min), time: String(press.minHour).padStart(2, '0') + ':00' }) }}</p>
          </template>
          <p v-else-if="detailed" class="wx-info"><Info :size="16" aria-hidden="true" /> {{ t('weather.pressure.unavailable') }}</p>
          <p v-else class="wx-info"><Info :size="16" aria-hidden="true" /> {{ t('weather.day.only7') }}</p>
        </section>

        <!-- Mare -->
        <section :style="{ '--i': 4 }" class="wx-block" aria-labelledby="dy-sea">
          <h2 id="dy-sea" class="wx-h">{{ t('weather.sea.title') }}</h2>
          <p v-if="!view.marine.available" class="wx-muted" style="margin:0">{{ t('weather.sea.none') }}</p>
          <p v-else-if="!detailed" class="wx-info"><Waves :size="16" aria-hidden="true" /> {{ t('weather.day.seaOnly7') }}</p>
          <template v-else>
            <dl class="wx-kv">
              <div><dt><WeatherIcon name="onda" :size="16" plain /> {{ t('weather.day.waveMaxL') }}</dt><dd><span class="wx-num">{{ fmt(day.waveHeightMax, 1) }}</span> <small>m</small></dd></div>
              <div><dt><WeatherIcon name="temp-mare" :size="16" plain /> {{ t('weather.sea.temp') }}</dt><dd><span class="wx-num">{{ fmt(seaTemp) }}</span> <small>°C</small></dd></div>
              <div v-if="view.marine.currentSpeed != null && index === 0"><dt><WeatherIcon name="corrente" :size="16" plain /> {{ t('weather.sea.current') }}</dt><dd><span class="wx-num">{{ fmt(view.marine.currentSpeed, 1) }}</span> <small>km/h</small></dd></div>
            </dl>
            <template v-if="waves.length > 1">
              <h3 class="wx-h wx-h3">{{ t('weather.day.waveChart') }}</h3>
              <WaveChart :waves="waves" />
            </template>
            <template v-if="tides">
              <h3 class="wx-h wx-h3">{{ t('weather.day.tides') }}</h3>
              <TideChart :tides="tides" :now-iso="`${day.date}T00:00`" />
              <p class="wx-note">{{ t('weather.sea.tideNote') }}</p>
            </template>
            <p v-else class="wx-note">{{ t('weather.sea.noTides') }}</p>
          </template>
        </section>

        <!-- Attività dei pesci -->
        <section :style="{ '--i': 5 }" class="wx-block" aria-labelledby="dy-act">
          <div class="wx-dy-top"><h2 id="dy-act" class="wx-h" style="margin:0"><WeatherIcon name="attivita-pesci" :size="20" /> {{ t('weather.day.activity') }}</h2><span class="wx-tag">{{ t('weather.day.indicative') }}</span></div>
          <p v-if="!detailed" class="wx-info" style="margin-top:10px"><Info :size="16" aria-hidden="true" /> {{ t('weather.day.only7') }}</p>
          <p v-else-if="fish.loading" class="wx-muted" role="status" style="margin:10px 0 0">{{ t('weather.day.loadingFish') }}</p>
          <p v-else-if="!act" class="wx-info" style="margin-top:10px"><Info :size="16" aria-hidden="true" /> {{ fish.failed ? t('weather.day.fishUnavailable') : t('weather.day.fishNoData') }}</p>
          <template v-else>
            <p class="wx-act-level" style="margin:10px 0 6px"><b>{{ act.label }}</b> <span class="wx-muted">· {{ t('weather.day.levelOf') }}</span></p>
            <DayActivityChart :hours="act.hours" :sunrise="day.sunrise" :sunset="day.sunset" :label="act.label" :windows="act.windows" />
            <h3 class="wx-sub wx-up">{{ t('weather.day.windows') }}</h3>
            <ul v-if="act.windows.length" class="wx-wins"><li v-for="w in act.windows" :key="w.from"><Fish :size="18" aria-hidden="true" /> <span class="wx-num">{{ w.from }}–{{ w.to }}</span></li></ul>
            <p v-else class="wx-muted" style="margin:0">{{ t('weather.day.noWindow') }}</p>
            <h3 class="wx-sub wx-up">{{ t('weather.day.weigh') }}</h3>
            <ul class="wx-fac">
              <li v-for="f in act.factors" :key="f.key"><span class="wx-v" :class="`wx-v-${f.verdict}`">{{ f.verdict }}</span><div><b>{{ t(`weather.day.factor.${f.key}`) }}</b><br /><span class="wx-muted">{{ f.text }}</span></div></li>
            </ul>
            <p class="wx-note"><Info :size="14" aria-hidden="true" style="vertical-align:-2px" /> {{ t('weather.day.actDisclaimer') }}</p>
          </template>
        </section>

        <!-- Pesci più probabili -->
        <section :style="{ '--i': 6 }" class="wx-block" aria-labelledby="dy-sp">
          <div class="wx-dy-top"><h2 id="dy-sp" class="wx-h" style="margin:0">{{ t('weather.day.species') }}</h2><span class="wx-tag">{{ t('weather.day.indicative') }}</span></div>
          <p v-if="fish.loading" class="wx-muted" role="status" style="margin:10px 0 0">{{ t('weather.day.loadingFish') }}</p>
          <p v-else-if="!sp" class="wx-info" style="margin-top:10px"><Info :size="16" aria-hidden="true" /> {{ fish.failed ? t('weather.day.fishUnavailable') : t('weather.day.fishNoData') }}</p>
          <template v-else>
            <ul class="wx-species">
              <li v-for="s in sp.items" :key="s.name">
                <RouterLink :to="{ name: 'species', params: { name: s.name } }" class="wx-sprow m-press">
                  <WeatherIcon name="attivita-pesci" :size="22" />
                  <span class="wx-sptx"><b>{{ s.name }}</b> <span v-if="sp.basis !== 'stagione'" class="wx-dots" aria-hidden="true"><i v-for="n in 3" :key="n" :class="{ on: n <= s.dots }"></i></span>
                    <br /><span class="wx-muted"><b class="wx-splv">{{ sp.basis === 'stagione' ? t('weather.day.seasonLevel.' + (s.dots >= 3 ? 'high' : s.dots === 2 ? 'mid' : 'low')) : s.label }}</b> · {{ s.reason }}<template v-if="s.userCatches"> {{ t('weather.day.yourCatches', { n: s.userCatches }) }}</template></span></span>
                  <ChevronRight :size="18" aria-hidden="true" class="wx-muted" />
                </RouterLink>
              </li>
            </ul>
            <p v-if="!sp.items.length" class="wx-muted" style="margin:10px 0 0">{{ t('weather.day.noSpecies') }}</p>
            <p class="wx-note"><Info :size="14" aria-hidden="true" style="vertical-align:-2px" /> {{ sp.basis === 'stagione' ? t('weather.day.speciesSeason') : t('weather.day.speciesBasis') }}</p>
          </template>
        </section>

        <!-- Vento -->
        <section :style="{ '--i': 7 }" class="wx-block" aria-labelledby="dy-wind">
          <h2 id="dy-wind" class="wx-h">{{ t('weather.now.wind') }}</h2>
          <div class="wx-wind-big"><WindArrow :speed="windDirRow?.windSpeed ?? day.windSpeed" :deg="windDirRow?.windDeg ?? null" />
            <span><span class="wx-num wx-big" style="font-size:1.6rem">{{ fmt(day.windSpeed) }}</span> <small class="wx-muted">km/h</small><br /><small class="wx-muted">{{ t('weather.now.gust') }} <span class="wx-num">{{ fmt(day.windGust) }}</span> km/h</small></span></div>
        </section>

        <!-- Luce e luna -->
        <section :style="{ '--i': 8 }" class="wx-block" aria-labelledby="dy-moon">
          <h2 id="dy-moon" class="wx-h">{{ t('weather.day.lightMoon') }}</h2>
          <div class="wx-grid wx-grid-2">
            <dl class="wx-kv" style="grid-template-columns:1fr 1fr">
              <div><dt><WeatherIcon name="alba" :size="16" /> {{ t('weather.glance.dawn') }}</dt><dd class="wx-num">{{ hhmm(day.sunrise) }}</dd></div>
              <div><dt><WeatherIcon name="tramonto" :size="16" /> {{ t('weather.glance.dusk') }}</dt><dd class="wx-num">{{ hhmm(day.sunset) }}</dd></div>
            </dl>
            <div style="display:flex;gap:12px;align-items:center">
              <MoonIcon :phase="moon.phase" :illumination="moon.illumination" :label="moonLabel(moon.phase)" />
              <div><p style="margin:0;font-weight:800">{{ moonLabel(moon.phase) }}</p><p class="wx-sub" style="margin:2px 0 0"><span class="wx-num">{{ percent(moon.illumination) }}</span> % {{ t('weather.glance.lit') }}</p></div>
            </div>
          </div>
        </section>

        <!-- Seconda fonte: versione compatta -->
      </StaggerList>
      <DayNav :prev="prev" :next="next" bottom />
      <p class="wx-note">{{ t('weather.disclaimer') }}</p>
    </template>
  </div>
</template>

<script setup>
// Dettaglio di un giorno: usa il pannello già scaricato (e salvato per l'offline) e chiede al server solo attività dei pesci e specie.
// Oltre 7 giorni non ci sono ore, pressione, mare e attività: i blocchi lo dicono con un messaggio chiaro.
import { ref, computed, watch, onMounted, defineComponent, h } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { WifiOff, CloudOff, MapPin, CalendarX, Info, Waves, Fish, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import PageHeader from '../components/PageHeader.vue'
import StaggerList from '../components/motion/StaggerList.vue'
import WeatherIcon from '../components/WeatherIcon.vue'
import { wmoLabel } from '../components/weather-icons.js'
import WeatherSkeleton from '../components/weather/WeatherSkeleton.vue'
import WindArrow from '../components/weather/WindArrow.vue'
import MoonIcon from '../components/weather/MoonIcon.vue'
import TideChart from '../components/weather/TideChart.vue'
import WaveChart from '../components/weather/WaveChart.vue'
import DayTempRainChart from '../components/weather/day/DayTempRainChart.vue'
import DayPressureChart from '../components/weather/day/DayPressureChart.vue'
import DayActivityChart from '../components/weather/day/DayActivityChart.vue'
import { useWeatherStore } from '../stores/weather.js'
import { fmt, hhmm, daylight, compass, moonOn, moonLabel, percent, longDate, rowWmo, reliability, hoursOfDay, wavesOfDay, tidesOfDay, dayBands, pressureDay, hasHourlyDetail } from '../utils/weather.js'
import '../assets/weather.css'
import '../assets/weather-day.css'

const { t } = useI18n()
const route = useRoute()
const store = useWeatherStore()
const date = computed(() => String(route.params.date || ''))
const view = computed(() => store.data)
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
if (typeof window !== 'undefined') { window.addEventListener('online', () => { online.value = true }); window.addEventListener('offline', () => { online.value = false }) }

const index = computed(() => view.value?.daily.findIndex(d => d.date === date.value) ?? -1)
const day = computed(() => (index.value >= 0 ? view.value.daily[index.value] : null))
const prev = computed(() => (index.value > 0 ? view.value.daily[index.value - 1].date : null))
const next = computed(() => (index.value >= 0 && index.value < view.value.daily.length - 1 ? view.value.daily[index.value + 1].date : null))
const title = computed(() => longDate(date.value))
const detailed = computed(() => !!view.value && hasHourlyDetail(view.value, date.value))
const rel = computed(() => reliability(index.value))
const offline = computed(() => !online.value || store.offlineNow || store.fromCache)
const updated = computed(() => (store.savedAt ? new Date(store.savedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''))
const place = computed(() => store.place?.name || t('weather.yourPosition'))

const state = computed(() => {
  if (!store.place) return 'noplace'
  if (!view.value) return store.status === 'loading' || store.status === 'idle' ? 'loading' : store.status === 'offline' ? 'offline' : 'error'
  return day.value ? 'ok' : (offline.value ? 'offline' : 'outside')
})

const rows = computed(() => (detailed.value ? hoursOfDay(view.value, date.value) : []))
const waves = computed(() => (detailed.value ? wavesOfDay(view.value.marine, date.value) : []))
const tides = computed(() => (detailed.value ? tidesOfDay(view.value.marine, date.value) : null))
const bands = computed(() => dayBands(rows.value, waves.value))
const press = computed(() => (detailed.value ? pressureDay(rows.value) : null))
const light = computed(() => daylight(day.value?.sunrise, day.value?.sunset))
const moon = computed(() => (index.value === 0 && view.value.fishing.moon.phase ? view.value.fishing.moon : moonOn(date.value)))
const seaTemp = computed(() => { const v = waves.value.map(w => w.seaTemp).filter(Number.isFinite); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null })
const windDirRow = computed(() => rows.value.find(r => r.hour === 12) || rows.value[Math.floor(rows.value.length / 2)] || null)
const windFrom = computed(() => compass(windDirRow.value?.windDeg))

const fish = ref({ loading: false, data: null, failed: false })
const act = computed(() => fish.value.data?.activity || null)
const sp = computed(() => fish.value.data?.species || null)
async function loadFish() {
  const d = date.value
  if (!day.value) return
  fish.value = { loading: true, data: null, failed: false }
  const r = await store.loadFishing(d)
  if (d === date.value) fish.value = { loading: false, data: r.data, failed: !!r.failed }
}
async function reload() { await store.load({ force: true }); loadFish() }
onMounted(async () => { await store.load(); loadFish() })
watch(date, () => { fish.value = { loading: false, data: null, failed: false }; loadFish() })

// Giorno prima / dopo (in alto e in basso)
const DayNav = defineComponent({
  props: { prev: String, next: String, bottom: Boolean },
  setup: p => () => h('div', { class: p.bottom ? 'wx-dnav wx-dnav-b' : 'wx-dnav' }, [
    p.prev ? h(RouterLink, { to: { name: 'weather-day', params: { date: p.prev } }, class: 'wx-icon-btn m-press', 'aria-label': t('weather.day.prev'), replace: true }, () => [h(ChevronLeft, { size: 18 }), p.bottom ? ` ${t('weather.day.prev')}` : null]) : h('span', { class: 'wx-icon-btn', 'aria-disabled': 'true' }, [h(ChevronLeft, { size: 18 })]),
    p.next ? h(RouterLink, { to: { name: 'weather-day', params: { date: p.next } }, class: 'wx-icon-btn m-press', 'aria-label': t('weather.day.next'), replace: true }, () => [p.bottom ? `${t('weather.day.next')} ` : null, h(ChevronRight, { size: 18 })]) : h('span', { class: 'wx-icon-btn', 'aria-disabled': 'true' }, [h(ChevronRight, { size: 18 })]),
  ]),
})
</script>

<template>
  <!-- Barra: il meteo ridotto sopra il mappamondo espanso (desktop). -->
  <section v-if="variant === 'bar'" class="hw-bar" :aria-label="t('home.weather.barLabel')">
    <p v-if="offline && state === 'ok'" class="hw-banner hw-banner-bar" role="status"><WifiOff :size="16" aria-hidden="true" /> {{ t('home.weather.offlineBanner') }} {{ t('weather.offline.cardShort', { time: savedLabel }) }}</p>
    <div v-if="state === 'ok'" class="hw-bar-row">
      <WeatherIcon :code="s.wmo" :is-day="s.isDay" :size="32" class="hw-ico" />
      <span class="hw-temp-s wx-num">{{ fmt(s.temp) }}°</span>
      <span class="hw-cond-s">{{ s.condition }}</span>
      <span class="hw-bar-det">
        <MapPin :size="14" aria-hidden="true" /> {{ place }} ·
        <span class="wx-num">{{ fmt(s.wind.speed) }}</span> km/h<template v-if="s.wind.info.from">{{ ' ' + t('weather.wind.from') + ' ' + s.wind.info.abbr }}</template><template v-if="s.wave">{{ ' · ' + t('weather.sea.wave').toLowerCase() + ' ' }}<span class="wx-num">{{ fmt(s.wave.height, 1) }}</span> m</template> ·
        <span class="wx-num">{{ fmt(s.pressure.value) }}</span> hPa<template v-if="pressWord">{{ ' ' + pressWord.toLowerCase() }}</template>
      </span>
      <RouterLink to="/meteo" class="hw-link m-press">{{ t('weather.card.open') }} <ArrowRight :size="16" aria-hidden="true" /></RouterLink>
    </div>
    <div v-else-if="state === 'loading'" class="hw-bar-row" aria-busy="true"><span class="wx-sr" role="status">{{ t('weather.loading') }}</span><div class="m-skeleton" style="height:32px;flex:1"></div></div>
    <div v-else class="hw-bar-row"><span class="hw-cond-s">{{ stateText }}</span><RouterLink to="/meteo" class="hw-link m-press">{{ t('weather.card.open') }} <ArrowRight :size="16" aria-hidden="true" /></RouterLink></div>
  </section>

  <!-- Scheda grande -->
  <section v-else class="hw-card" :aria-label="t('weather.card.label')" :aria-busy="state === 'loading' ? 'true' : undefined">
    <!-- Senza luogo -->
    <div v-if="state === 'noplace'" class="hw-empty">
      <MapPin :size="28" aria-hidden="true" class="hw-ico" />
      <h2 class="hw-title">{{ t('home.weather.noPlaceTitle') }}</h2>
      <p>{{ t('home.weather.noPlaceText') }}</p>
      <RouterLink to="/meteo" class="fl-btn1 m-press hw-cta"><Search :size="18" aria-hidden="true" /> {{ t('home.weather.search') }}</RouterLink>
    </div>

    <!-- Errore -->
    <div v-else-if="state === 'error'" class="hw-error" role="alert">
      <h2 class="hw-title hw-title-row"><TriangleAlert :size="20" aria-hidden="true" /> {{ t('weather.error.title') }}</h2>
      <p>{{ t('home.weather.errorHint') }}</p>
      <button type="button" class="fl-btn1 m-press hw-retry" @click="retry"><RefreshCw :size="18" aria-hidden="true" /> {{ t('weather.retry') }}</button>
    </div>

    <!-- Offline senza dati -->
    <div v-else-if="state === 'offlineEmpty'" class="hw-empty" role="status">
      <WifiOff :size="28" aria-hidden="true" class="hw-ico" />
      <h2 class="hw-title">{{ t('weather.offline.title') }}</h2>
      <p>{{ t('weather.offline.empty') }}</p>
    </div>

    <!-- Caricamento: solo scheletri -->
    <div v-else-if="state === 'loading'" class="hw-sk">
      <p class="wx-sr" role="status">{{ t('weather.loading') }}</p>
      <div class="m-skeleton" style="height:20px;width:60%"></div>
      <div class="m-skeleton" style="height:84px"></div>
      <div class="m-skeleton" style="height:96px"></div>
    </div>

    <template v-else>
      <p v-if="offline" class="hw-banner" role="status"><WifiOff :size="16" aria-hidden="true" /> {{ t('home.weather.offlineBanner') }}</p>
      <div class="hw-top">
        <h2 class="hw-place"><MapPin :size="16" aria-hidden="true" /> <RouterLink to="/meteo" class="hw-place-link">{{ place }}</RouterLink></h2>
        <span v-if="offline" class="hw-stale wx-num">{{ t('home.weather.staleLabel', { time: savedLabel }) }}</span>
        <span v-else class="hw-upd">{{ t('home.weather.updatedAt', { time: savedLabel }) }}</span>
      </div>

      <div class="hw-now">
        <WeatherIcon :code="s.wmo" :is-day="s.isDay" :size="56" class="hw-ico" />
        <div>
          <p class="hw-temp"><span class="wx-num">{{ fmt(s.temp) }}</span><span class="hw-deg">°</span>
            <span class="hw-feels">{{ t('home.weather.feels', { n: fmt(s.feels) }) }}</span></p>
          <p class="hw-cond">{{ s.condition }}</p>
        </div>
      </div>

      <div class="hw-hours" role="group" :aria-label="t('home.weather.next')">
        <div v-for="h in s.hours" :key="h.key" class="hw-hour">
          <span class="wx-num hw-h-t">{{ h.hour == null ? MISSING : String(h.hour).padStart(2, '0') + ':00' }}</span>
          <WeatherIcon :code="h.wmo" :is-day="h.isDay" :size="22" /><span class="wx-sr">{{ wmoLabel(h.wmo) }}</span>
          <span class="wx-num hw-h-v">{{ fmt(h.temp) }}°</span>
          <WindArrow v-if="h.wind != null" :speed="h.wind" :deg="h.windDeg" class="hw-h-w" />
          <span class="wx-num hw-h-wv">{{ fmt(h.wind) }}</span>
        </div>
      </div>

      <dl class="hw-grid">
        <div class="hw-tile">
          <dt><WeatherIcon name="vento" :size="14" plain /> {{ t('weather.now.wind') }}</dt>
          <dd><span class="wx-num hw-v">{{ fmt(s.wind.speed) }}</span> <small>km/h</small>
            <small class="hw-sub2"><template v-if="s.wind.info.calm">{{ t('weather.wind.calm') }}</template><template v-else-if="s.wind.info.from">{{ t('weather.wind.from') }} <abbr :title="s.wind.info.name">{{ s.wind.info.abbr }}</abbr></template><template v-if="s.wind.gust != null"> · {{ t('home.weather.gust', { n: fmt(s.wind.gust) }) }}</template></small></dd>
        </div>
        <div class="hw-tile">
          <dt><WeatherIcon name="pressione" :size="14" plain /> {{ t('weather.now.pressure') }}</dt>
          <dd><span class="wx-num hw-v">{{ fmt(s.pressure.value) }}</span> <small>hPa</small>
            <small v-if="pressWord" class="hw-sub2" :class="`hw-pt-${s.pressure.state.key}`">{{ pressWord }}</small></dd>
        </div>
        <div v-if="s.wave" class="hw-tile">
          <dt><WeatherIcon name="onda" :size="14" plain /> {{ t('weather.sea.wave') }}</dt>
          <dd><span class="wx-num hw-v">{{ fmt(s.wave.height, 1) }}</span> <small>m</small>
            <small class="hw-sub2">{{ t('home.weather.period', { n: fmt(s.wave.period) }) }}</small></dd>
        </div>
        <div class="hw-tile" :class="{ 'hw-wide': !s.wave }">
          <dt><WeatherIcon name="pioggia-prob" :size="14" plain /> {{ t('weather.now.rain') }}</dt>
          <dd><span class="wx-num hw-v">{{ fmt(s.rain.prob) }}%</span>
            <small class="hw-sub2">{{ t('home.weather.expectedMm', { mm: fmt(s.rain.mm, 1) }) }}</small></dd>
        </div>
      </dl>

      <RouterLink to="/meteo" class="hw-link hw-open m-press">{{ t('weather.card.open') }} <ArrowRight :size="16" aria-hidden="true" /></RouterLink>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, WifiOff, ArrowRight, Search, RefreshCw, TriangleAlert } from 'lucide-vue-next'
import WeatherIcon from '../WeatherIcon.vue'
import WindArrow from './WindArrow.vue'
import { wmoLabel } from '../weather-icons.js'
import { fmt, MISSING } from '../../utils/weather.js'
import { useHomeWeather } from '../../composables/useHomeWeather.js'
import '../../assets/weather.css'

const props = defineProps({ variant: { type: String, default: 'card' } }) // 'card' | 'bar'
const { t } = useI18n()
const { state, offline, summary, placeName, savedLabel, retry } = useHomeWeather({ autoload: props.variant !== 'bar' })
const s = computed(() => summary.value)
const place = computed(() => placeName.value || t('weather.yourPosition'))
const pressWord = computed(() => {
  const st = s.value?.pressure.state
  return st?.key ? t(`weather.pressure.${st.key}${st.strong ? 'Strong' : ''}`) : null
})
const stateText = computed(() => state.value === 'noplace' ? t('home.weather.noPlaceTitle') : state.value === 'error' ? t('weather.error.title') : t('weather.offline.title'))
</script>

<style scoped>
.hw-card { display: grid; gap: 14px; padding: 16px; border-radius: 24px 24px 24px 8px; background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); min-width: 0; }
.hw-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.hw-place { margin: 0; display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-sans); font-weight: 800; font-size: 1rem; color: rgb(var(--color-ocean-text)); min-width: 0; }
.hw-place-link { color: rgb(var(--color-foam)); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; overflow-wrap: anywhere; }
.hw-place-link:hover { text-decoration: underline; }
.hw-upd { font-size: .8rem; color: rgb(var(--color-muted)); }
.hw-stale { font-size: .75rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid rgb(var(--color-sand-text)); color: rgb(var(--color-sand-text)); }
.hw-banner { display: flex; align-items: center; gap: 8px; margin: 0; padding: 10px 14px; border-radius: 14px; border: 1px solid rgb(var(--color-sand-text)); background: rgb(var(--color-sand) / .12); color: rgb(var(--color-foam)); font-size: .88rem; font-weight: 600; }
.hw-banner svg { color: rgb(var(--color-sand-text)); flex: none; }
.hw-ico { color: rgb(var(--color-ocean-text)); flex: none; }
.hw-now { display: flex; align-items: center; gap: 14px; }
.hw-temp { margin: 0; display: flex; align-items: baseline; gap: 12px; line-height: 1; color: rgb(var(--color-foam)); }
.hw-temp .wx-num { font-size: 2.75rem; font-weight: 700; letter-spacing: -.02em; }
.hw-deg { font-family: var(--font-mono); font-size: 2.2rem; margin-left: -8px; }
.hw-feels { font-size: .8rem; color: rgb(var(--color-muted)); }
.hw-cond { margin: 6px 0 0; font-weight: 700; color: rgb(var(--color-foam)); }
.hw-hours { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; padding: 10px 6px; border-radius: 14px; background: rgb(var(--color-surface-2)); }
.hw-hour:nth-child(n+6) { display: none; }
@media (min-width: 768px) {
  .hw-card { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: 'top top' 'now tiles' 'hours hours' 'open open'; column-gap: 20px; align-items: center; }
  .hw-hours { grid-template-columns: repeat(8, minmax(0, 1fr)); }
  .hw-hour:nth-child(n+6) { display: grid; }
  .hw-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .hw-grid .hw-wide { grid-column: auto; }
  .hw-top { grid-area: top; } .hw-now { grid-area: now; } .hw-grid { grid-area: tiles; } .hw-hours { grid-area: hours; } .hw-open { grid-area: open; }
}
.hw-hour { display: grid; justify-items: center; gap: 4px; font-size: .78rem; min-width: 0; }
.hw-h-t { font-size: .72rem; color: rgb(var(--color-muted)); }
.hw-h-v { font-weight: 700; color: rgb(var(--color-foam)); }
.hw-h-w { color: rgb(var(--color-ocean-text)); }
.hw-h-w :deep(.wx-wind-tx) { display: none; }
.hw-h-w :deep(svg) { width: 14px; height: 14px; }
.hw-h-wv { font-size: .72rem; color: rgb(var(--color-muted)); }
.hw-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
.hw-tile { background: rgb(var(--color-surface-2)); border-radius: 14px; padding: 12px; min-width: 0; }
.hw-wide { grid-column: span 2; }
.hw-tile dt { display: flex; align-items: center; gap: 6px; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: rgb(var(--color-muted)); }
.hw-tile dd { margin: 6px 0 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 6px; color: rgb(var(--color-foam)); }
.hw-v { font-size: 1.5rem; font-weight: 700; }
.hw-tile small { font-size: .78rem; color: rgb(var(--color-muted)); }
.hw-tile abbr { text-decoration: none; font-weight: 700; color: rgb(var(--color-foam)); }
.hw-sub2 { flex-basis: 100%; }
.hw-pt-falling { color: rgb(var(--color-sand-text)) !important; font-weight: 700; }
.hw-pt-rising { color: rgb(var(--color-ocean-text)) !important; font-weight: 700; }
.hw-link { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-weight: 800; font-size: .9rem; color: rgb(var(--color-foam)); text-decoration: none; border-radius: 10px; }
.hw-open { justify-content: space-between; border-top: 1px solid rgb(var(--color-border)); padding-top: 4px; border-radius: 0; }
.hw-link:hover { text-decoration: underline; }
.hw-link:focus-visible, .hw-place-link:focus-visible, .hw-cta:focus-visible, .hw-retry:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.hw-empty { display: grid; gap: 10px; justify-items: start; }
.hw-empty p, .hw-error p { margin: 0; color: rgb(var(--color-muted)); line-height: 1.45; font-size: .92rem; }
.hw-title { font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; margin: 0; color: rgb(var(--color-foam)); }
.hw-title-row { display: flex; align-items: center; gap: 8px; font-family: var(--font-sans); font-size: 1.05rem; font-weight: 800; }
.hw-error { display: grid; gap: 10px; }
.hw-cta, .hw-retry { width: 100%; text-decoration: none; }
.hw-sk { display: grid; gap: 12px; }

/* barra (desktop, mappamondo espanso) */
.hw-bar { display: grid; gap: 8px; padding: 10px 14px; border-radius: 20px; background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); }
.hw-bar-row { display: flex; align-items: center; gap: 12px; min-width: 0; flex-wrap: wrap; }
.hw-temp-s { font-size: 1.5rem; font-weight: 700; color: rgb(var(--color-foam)); }
.hw-cond-s { font-weight: 700; color: rgb(var(--color-foam)); }
.hw-bar-det { flex: 1; min-width: 200px; font-size: .8rem; color: rgb(var(--color-muted)); display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.hw-banner-bar { padding: 6px 12px; font-size: .82rem; }

/* Tema chiaro: il bianco su ocean (3 130 195) dà 4,2:1, sotto AA; qui si usa ocean-dark (≈ 6:1). */
:root[data-theme='light'] .hw-cta, :root[data-theme='light'] .hw-retry { background: rgb(var(--color-ocean-dark)); }
:root[data-theme='light'] .hw-pt-falling { color: rgb(146 64 14) !important; }
</style>

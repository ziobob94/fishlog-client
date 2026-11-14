<template>
  <!-- Scheda grande -->
  <section class="hw-card" :aria-label="t('weather.card.label')" :aria-busy="state === 'loading' ? 'true' : undefined">
    <!-- Senza luogo -->
    <div v-if="state === 'noplace'" class="hw-empty">
      <MapPin :size="28" aria-hidden="true" class="hw-ico" />
      <h2 class="hw-title">{{ t('home.weather.noPlaceTitle') }}</h2>
      <p>{{ denied ? t('home.weather.deniedText') : t('home.weather.noPlaceText') }}</p>
      <button v-if="!denied" type="button" class="fl-btn1 m-press hw-cta" :disabled="activating" @click="activate"><MapPin :size="18" aria-hidden="true" /> {{ activating ? t('home.globe.locating') : t('home.weather.activatePosition') }}</button>
      <RouterLink :to="{ path: '/meteo', query: { modo: 'cerca' } }" class="m-press hw-cta" :class="denied ? 'fl-btn1' : 'hw-link'"><Search :size="18" aria-hidden="true" /> {{ denied ? t('home.weather.pickPlace') : t('home.weather.search') }}</RouterLink>
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
      <p v-if="offline && open" class="hw-banner" role="status"><WifiOff :size="16" aria-hidden="true" /> {{ t('home.weather.offlineBanner') }}</p>
      <div class="hw-top">
        <!-- Intestazione: un solo <button> per chiusa (badge di una riga) e aperta (luogo e aggiornamento) -->
        <button type="button" class="hw-toggle m-press" :class="{ 'is-open': open }" :aria-expanded="open ? 'true' : 'false'" aria-controls="hw-more" :aria-label="toggleLabel" @click="toggle">
          <template v-if="!open">
            <WeatherIcon :code="s.wmo" :is-day="s.isDay" :size="32" class="hw-ico" />
            <span class="hw-temp-s wx-num">{{ fmt(s.temp) }}°</span>
            <span class="hw-badge-txt">
              <span class="hw-badge-cond">{{ s.condition }}</span>
              <span class="hw-badge-sub">
                <span v-if="offline" class="hw-badge-stale wx-num">{{ t('home.weather.staleLabel', { time: savedLabel }) }} · </span>{{ place }}<template v-if="s.wind.info.calm"> · {{ t('weather.wind.calm').toLowerCase() }}</template><template v-else-if="s.wind.info.from"> · {{ t('home.weather.windFrom', { dir: s.wind.info.abbr }) }}</template>
              </span>
            </span>
            <span v-if="pressWord" class="hw-badge-press" :class="`hw-pt-${s.pressure.state.key}`"><WeatherIcon name="pressione" :size="14" plain /> {{ pressWord }}</span>
          </template>
          <template v-else>
            <MapPin :size="16" aria-hidden="true" class="hw-pin" />
            <span class="hw-head">
              <span class="hw-place">{{ place }}</span>
              <span v-if="offline" class="hw-stale wx-num">{{ t('home.weather.staleLabel', { time: savedLabel }) }}</span>
              <span v-else class="hw-upd">{{ t('home.weather.updatedAt', { time: savedLabel }) }}</span>
            </span>
          </template>
          <ChevronDown :size="18" aria-hidden="true" class="hw-chev" :class="{ 'is-open': open }" />
        </button>
        <button v-if="open" type="button" class="hw-refresh m-press" :aria-disabled="refreshDisabled || undefined" :aria-label="refreshLabel" :title="refreshLabel" @click="refresh">
          <span v-if="refreshing" class="m-spinner" style="width:14px;height:14px" aria-hidden="true"></span><RefreshCw v-else :size="16" aria-hidden="true" />
        </button>
        <p v-if="refreshing" class="wx-sr" role="status">{{ t('weather.refreshing') }}</p>
        <p v-else-if="refreshFailed && !offline && open" class="hw-banner hw-banner-err" role="alert"><TriangleAlert :size="16" aria-hidden="true" /> {{ t('home.weather.refreshFailed') }}</p>
      </div>

      <div id="hw-more" class="hw-more m-collapse" :class="{ 'is-open': open }" :inert="!open || undefined">
        <div class="hw-more-in m-collapse-in">
        <div class="hw-now">
          <WeatherIcon :code="s.wmo" :is-day="s.isDay" :size="56" class="hw-ico" />
          <div>
            <p class="hw-temp"><span class="wx-num">{{ fmt(s.temp) }}</span><span class="hw-deg">°</span>
              <span class="hw-feels">{{ t('home.weather.feels', { n: fmt(s.feels) }) }}</span></p>
            <p class="hw-cond">{{ s.condition }}</p>
          </div>
        </div>

        <div class="hw-hours" role="group" tabindex="0" :aria-label="t('home.weather.next')">
          <template v-for="h in s.hours" :key="h.key">
          <span v-if="h.dayLabel" class="wx-num hw-day">{{ h.dayLabel }}</span>
          <div class="hw-hour">
            <span class="wx-num hw-h-t">{{ h.hour == null ? MISSING : String(h.hour).padStart(2, '0') + ':00' }}</span>
            <WeatherIcon :code="h.wmo" :is-day="h.isDay" :size="22" /><span class="wx-sr">{{ wmoLabel(h.wmo) }}</span>
            <span class="wx-num hw-h-v">{{ fmt(h.temp) }}°</span>
            <WindArrow v-if="h.wind != null" :speed="h.wind" :deg="h.windDeg" class="hw-h-w" />
            <span class="wx-num hw-h-wv">{{ fmt(h.wind) }}</span>
          </div>
          </template>
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
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, WifiOff, ArrowRight, Search, RefreshCw, TriangleAlert, ChevronDown } from 'lucide-vue-next'
import WeatherIcon from '../WeatherIcon.vue'
import WindArrow from './WindArrow.vue'
import { wmoLabel } from '../weather-icons.js'
import { fmt, MISSING } from '../../utils/weather.js'
import { useAccordion } from '../../composables/useAccordion.js'
import { useHomeWeather } from '../../composables/useHomeWeather.js'
import '../../assets/weather.css'

const { t } = useI18n()
const { activate, activating, denied, state, offline, summary, placeName, savedLabel, retry, refresh, refreshing, refreshFailed, coolingDown } = useHomeWeather()
const s = computed(() => summary.value)
const place = computed(() => placeName.value || t('weather.yourPosition'))
const pressWord = computed(() => {
  const st = s.value?.pressure.state
  return st?.key ? t(`weather.pressure.${st.key}${st.strong ? 'Strong' : ''}`) : null
})
// Accordion: chiusa = badge di una riga; aperta = riepilogo completo. Parte aperta e ricorda la scelta sul dispositivo.
const { open, toggle } = useAccordion('fishlog.homeWeatherOpen', true)
const toggleLabel = computed(() => open.value ? t('home.weather.collapse') : t('home.weather.expandLabel', { place: place.value }))
const refreshDisabled = computed(() => offline.value || refreshing.value || coolingDown.value)
const refreshLabel = computed(() => refreshing.value ? t('weather.refreshing') : offline.value ? t('home.weather.refreshOffline') : coolingDown.value ? t('home.weather.refreshWait') : t('weather.refresh'))
</script>

<style scoped>
.hw-card { display: grid; gap: 12px; padding: 12px 16px 14px; border-radius: 24px 24px 24px 8px; background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); min-width: 0; }
.hw-top { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.hw-head { flex: 1 1 0; min-width: 0; display: grid; gap: 0; }
.hw-place { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-sans); font-weight: 800; font-size: 1rem; color: rgb(var(--color-foam)); min-width: 0; }
.hw-place-link { color: rgb(var(--color-foam)); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hw-place-link:hover { text-decoration: underline; }
.hw-refresh { min-width: 44px; min-height: 44px; margin: 0; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: none; border: 0; color: rgb(var(--color-foam)); cursor: pointer; }
.hw-refresh[aria-disabled='true'] { opacity: .55; cursor: not-allowed; }
.hw-refresh:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.hw-toggle { flex: 1 1 0; min-width: 0; min-height: 44px; display: flex; align-items: center; gap: 10px; margin: 0; padding: 4px 4px 4px 8px; border: 0; border-radius: 14px; background: none; color: rgb(var(--color-foam)); text-align: left; cursor: pointer; font: inherit; }
.hw-toggle:not(.is-open) { padding: 8px 8px 8px 12px; background: rgb(var(--color-surface-2)); }
.hw-toggle:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.hw-pin { flex: none; }
.hw-badge-txt { flex: 1 1 0; min-width: 0; display: grid; line-height: 1.2; }
.hw-badge-cond { font-weight: 700; font-size: .9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hw-badge-sub { font-size: .75rem; color: rgb(var(--color-muted)); overflow: hidden; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.hw-badge-stale { color: rgb(var(--color-sand-text)); font-weight: 700; }
.hw-badge-press { flex: none; display: inline-flex; align-items: center; gap: 4px; font-size: .75rem; font-weight: 700; color: rgb(var(--color-muted)); }
.hw-badge-press.hw-pt-steady { font-weight: 600; }
@media (max-width: 380px) { .hw-badge-press { display: none; } }
.hw-chev { flex: none; margin-left: auto; transition: transform var(--motion-base) var(--ease-standard); }
.hw-chev.is-open { transform: rotate(180deg); }
.hw-more { margin-top: -12px; }
.hw-more.is-open { margin-top: 0; }
.hw-more-in { display: grid; gap: 12px; }
.hw-temp-s { flex: none; font-size: 1.6rem; font-weight: 700; letter-spacing: -.02em; line-height: 1; color: rgb(var(--color-foam)); }
.hw-upd { font-size: .75rem; color: rgb(var(--color-muted)); }
.hw-stale { justify-self: start; font-size: .75rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid rgb(var(--color-sand-text)); color: rgb(var(--color-sand-text)); }
.hw-banner { display: flex; align-items: center; gap: 8px; margin: 0; padding: 10px 14px; border-radius: 14px; border: 1px solid rgb(var(--color-sand-text)); background: rgb(var(--color-sand) / .12); color: rgb(var(--color-foam)); font-size: .88rem; font-weight: 600; }
.hw-banner-err { flex-basis: 100%; }
.hw-banner svg { color: rgb(var(--color-sand-text)); flex: none; }
.hw-ico { color: rgb(var(--color-ocean-text)); flex: none; }
.hw-now { display: flex; align-items: center; gap: 14px; }
.hw-temp { margin: 0; display: flex; align-items: baseline; gap: 12px; line-height: 1; color: rgb(var(--color-foam)); }
.hw-temp .wx-num { font-size: 2.75rem; font-weight: 700; letter-spacing: -.02em; }
.hw-deg { font-family: var(--font-mono); font-size: 2.2rem; margin-left: -8px; }
.hw-feels { font-size: .8rem; color: rgb(var(--color-muted)); }
.hw-cond { margin: 6px 0 0; font-weight: 700; color: rgb(var(--color-foam)); }
.hw-hours { --n: 5; display: flex; gap: 4px; padding: 10px 6px; border-radius: 14px; background: rgb(var(--color-surface-2)); overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; scroll-snap-type: x proximity; scroll-padding-inline: 6px; scrollbar-width: none; }
.hw-hours::-webkit-scrollbar { display: none; }
.hw-hours:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.hw-hour { flex: 0 0 calc((100% - (var(--n) - 1) * 4px) / var(--n)); scroll-snap-align: start; }
.hw-day { flex: none; scroll-snap-align: start; writing-mode: vertical-rl; transform: rotate(180deg); align-self: stretch; text-align: center; padding-inline: 4px; border-right: 1px solid rgb(var(--color-border)); font-size: .72rem; font-weight: 700; color: rgb(var(--color-ocean-text)); white-space: nowrap; }
@media (min-width: 768px) {
  .hw-more-in { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: 'now tiles' 'hours hours' 'open open'; column-gap: 20px; align-items: center; }
  .hw-hours { --n: 8; }
  .hw-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .hw-grid .hw-wide { grid-column: auto; }
  .hw-now { grid-area: now; } .hw-grid { grid-area: tiles; } .hw-hours { grid-area: hours; } .hw-open { grid-area: open; }
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
.hw-open { display: flex; justify-content: space-between; border-top: 1px solid rgb(var(--color-border)); padding-top: 4px; border-radius: 0; }
.hw-link:hover { text-decoration: underline; }
.hw-link:focus-visible, .hw-place-link:focus-visible, .hw-cta:focus-visible, .hw-retry:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.hw-empty { display: grid; gap: 10px; justify-items: start; }
.hw-empty p, .hw-error p { margin: 0; color: rgb(var(--color-muted)); line-height: 1.45; font-size: .92rem; }
.hw-title { font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; margin: 0; color: rgb(var(--color-foam)); }
.hw-title-row { display: flex; align-items: center; gap: 8px; font-family: var(--font-sans); font-size: 1.05rem; font-weight: 800; }
.hw-error { display: grid; gap: 10px; }
.hw-cta, .hw-retry { width: 100%; text-decoration: none; }
.hw-sk { display: grid; gap: 12px; }

/* Tema chiaro: il bianco su ocean (3 130 195) dà 4,2:1, sotto AA; qui si usa ocean-dark (≈ 6:1). */
:root[data-theme='light'] .hw-cta, :root[data-theme='light'] .hw-retry { background: rgb(var(--color-ocean-dark)); }
:root[data-theme='light'] .hw-pt-falling { color: rgb(146 64 14) !important; }
</style>

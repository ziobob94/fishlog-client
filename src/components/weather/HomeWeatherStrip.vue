<template>
  <RouterLink to="/meteo" class="hws m-press">
    <template v-if="state === 'ok'">
      <WeatherIcon :code="s.wmo" :is-day="s.isDay" :size="30" class="hws-ico" />
      <span class="wx-num hws-temp">{{ fmt(s.temp) }}°</span>
      <span class="hws-tx">
        <span><span class="wx-num">{{ fmt(s.wind.speed) }}</span> km/h<template v-if="s.wind.info.from">{{ ' ' + t('weather.wind.from') + ' ' + s.wind.info.abbr }}</template><template v-if="s.wave">{{ ' · ' + t('weather.sea.wave').toLowerCase() + ' ' }}<span class="wx-num">{{ fmt(s.wave.height, 1) }}</span> m</template></span>
        <b v-if="pressWord" :class="`hws-pt-${s.pressure.state.key}`">{{ t('weather.now.pressure') }} {{ pressWord.toLowerCase() }}</b>
      </span>
    </template>
    <span v-else class="hws-tx"><b>{{ stateText }}</b></span>
    <ChevronRight :size="18" aria-hidden="true" class="hws-chev" />
  </RouterLink>
</template>

<script setup>
// Striscia meteo in fondo al mappamondo espanso (mobile): porta alla pagina Meteo.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from 'lucide-vue-next'
import WeatherIcon from '../WeatherIcon.vue'
import { fmt } from '../../utils/weather.js'
import { useHomeWeather } from '../../composables/useHomeWeather.js'

const { t } = useI18n()
const { state, summary } = useHomeWeather({ autoload: false })
const s = computed(() => summary.value)
const pressWord = computed(() => { const st = s.value?.pressure.state; return st?.key ? t(`weather.pressure.${st.key}${st.strong ? 'Strong' : ''}`) : null })
const stateText = computed(() => state.value === 'noplace' ? t('home.weather.noPlaceTitle') : state.value === 'error' ? t('weather.error.title') : state.value === 'loading' ? t('weather.loading') : t('weather.offline.title'))
</script>

<style scoped>
.hws { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 8px 12px; border-radius: 18px; text-decoration: none; color: rgb(var(--color-foam));
  background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); }
.hws:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.hws-ico { color: rgb(var(--color-ocean-text)); flex: none; }
.hws-temp { font-size: 1.4rem; font-weight: 700; }
.hws-tx { flex: 1; min-width: 0; display: grid; font-size: .8rem; line-height: 1.3; color: rgb(var(--color-muted)); }
.hws-tx b { font-weight: 800; color: rgb(var(--color-foam)); }
.hws-tx b.hws-pt-falling { color: rgb(var(--color-sand-text)); }
.hws-tx b.hws-pt-rising { color: rgb(var(--color-ocean-text)); }
.hws-chev { flex: none; color: rgb(var(--color-muted)); }
</style>

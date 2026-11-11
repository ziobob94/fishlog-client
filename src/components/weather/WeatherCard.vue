<template>
  <section class="wx-block wx-card" :aria-label="t('weather.card.label')">
    <div class="wx-bar-row">
      <h2 class="wx-h" style="margin:0"><RouterLink to="/meteo" class="wx-title-link">{{ t('weather.card.title') }}</RouterLink></h2>
      <span v-if="store.place && label" class="wx-upd">{{ label }}</span>
    </div>

    <div v-if="!store.place" class="wx-state" style="padding:8px 0">
      <p>{{ t('weather.card.noPlace') }}</p>
      <RouterLink to="/meteo" class="fl-btn1 m-press" style="text-decoration:none;display:inline-flex;align-items:center">{{ t('weather.card.setPlace') }}</RouterLink>
    </div>

    <div v-else-if="!store.data && store.status === 'error'" class="wx-state" style="padding:8px 0" role="alert">
      <p>{{ t('weather.error.text') }}</p>
      <button type="button" class="wx-icon-btn m-press" @click="store.load({ force: true })">{{ t('weather.retry') }}</button>
    </div>

    <div v-else-if="!store.data && store.status === 'offline'" class="wx-state" style="padding:8px 0" role="status"><p>{{ t('weather.offline.empty') }}</p></div>

    <div v-else-if="!store.data" class="wx-sk" aria-busy="true"><p class="wx-sr" role="status">{{ t('weather.loading') }}</p><div class="m-skeleton" style="height:64px"></div></div>

    <template v-else>
      <p v-if="offline" class="wx-note" role="status" style="margin:0"><WifiOff :size="14" aria-hidden="true" style="display:inline;vertical-align:-2px" /> {{ t('weather.offline.cardShort', { time: label }) }}</p>
      <div class="wx-card-tiles">
        <div v-for="x in tiles" :key="x.key" class="wx-card-tile"><span class="wx-num">{{ x.value }}</span><small>{{ x.label }}</small></div>
      </div>
    </template>

    <RouterLink to="/meteo" class="wx-link">{{ t('weather.card.open') }} <ArrowRight :size="16" aria-hidden="true" /></RouterLink>
  </section>
</template>

<script setup>
// Scheda compatta per la Home: temperatura, vento, pressione, onde (senza mare → pioggia). Nessuna chiamata al montaggio se il
// dato in cache è recente; la posizione si chiede solo dalla pagina /meteo (qui solo se il permesso è già concesso).
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, WifiOff } from 'lucide-vue-next'
import { useWeatherStore } from '../../stores/weather.js'
import { fmt } from '../../utils/weather.js'
import '../../assets/weather.css'

const { t } = useI18n()
const store = useWeatherStore()
const online = typeof navigator === 'undefined' ? true : navigator.onLine
const offline = computed(() => store.offlineNow || !online)
const label = computed(() => (store.savedAt ? new Date(store.savedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''))
const tiles = computed(() => {
  const d = store.data; if (!d) return []
  const c = d.current
  return [
    { key: 'temp', label: t('weather.now.temp'), value: `${fmt(c.temp)}°` },
    { key: 'wind', label: t('weather.card.windKmh'), value: fmt(c.windSpeed) },
    { key: 'pressure', label: 'hPa', value: fmt(c.pressure) },
    d.marine.available
      ? { key: 'wave', label: t('weather.card.waveM'), value: fmt(d.marine.waveHeight, 1) }
      : { key: 'rain', label: t('weather.card.rain'), value: `${fmt(c.precipProbability)}%` },
  ]
})
onMounted(async () => {
  if (!store.place) {
    try { // con il permesso già concesso si usa la posizione senza chiedere nulla
      const p = await navigator.permissions?.query({ name: 'geolocation' })
      if (p?.state === 'granted' && await store.useHere()) await store.load()
    } catch { /* nessun permesso noto: la scheda invita a impostare il luogo */ }
    return
  }
  store.load() // se il dato in cache è recente non parte nessuna richiesta
})
</script>

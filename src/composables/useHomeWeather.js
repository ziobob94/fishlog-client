// Dati meteo per la Home (scheda grande, barra e striscia del mappamondo): stessa fonte e stessa cache della pagina Meteo.
// La posizione si chiede solo dalla pagina /meteo; qui si usa se il permesso è già concesso. Se il dato in cache è recente non parte nessuna richiesta.
import { computed, onMounted } from 'vue'
import { useWeatherStore } from '../stores/weather.js'
import { useOnline } from './useOnline.js'
import { reverseLabel } from '../utils/places.js'
import { rowWmo, rowLabel, isDayAt, windInfo, pressureState } from '../utils/weather.js'

const clock = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })

// autoload=false: la barra e la striscia non caricano da sole (lo fa già la scheda); leggono lo stesso store.
export function useHomeWeather({ autoload = true } = {}) {
  const store = useWeatherStore()
  const online = useOnline()
  const offline = computed(() => store.offlineNow || !online.value)
  // noplace | ok | error | offlineEmpty | loading
  const state = computed(() => {
    if (store.data) return 'ok'
    if (!store.place) return 'noplace'
    if (store.status === 'error') return 'error'
    if (store.status === 'offline' || !online.value) return 'offlineEmpty'
    return 'loading'
  })
  const savedLabel = computed(() => (store.savedAt ? clock(store.savedAt) : ''))

  const summary = computed(() => {
    const d = store.data
    if (!d) return null
    const c = d.current
    const sunrise = d.daily?.[0]?.sunrise, sunset = d.daily?.[0]?.sunset
    const press = pressureState(d.fishing?.pressure?.trend, d.fishing?.pressure?.delta3h)
    return {
      temp: c.temp, feels: c.feelsLike,
      wmo: rowWmo(c), isDay: c.isDay !== false, condition: rowLabel(c, c.description),
      hours: (d.hourly || []).slice(0, 8).map(h => ({
        key: h.time || `${h.date}-${h.hour}`, hour: h.hour, wmo: rowWmo(h), isDay: isDayAt(h.hour, sunrise, sunset),
        temp: h.temp, wind: h.windSpeed, windDeg: h.windDeg,
      })),
      wind: { speed: c.windSpeed, gust: c.windGust, info: windInfo(c.windSpeed, c.windDeg) },
      pressure: { value: c.pressure, state: press },
      wave: d.marine.available ? { height: d.marine.waveHeight, period: d.marine.wavePeriod } : null,
      rain: { prob: c.precipProbability, mm: c.precipMm },
    }
  })
  const placeName = computed(() => store.place?.name || '')

  async function init() {
    if (!store.place) {
      try { // con il permesso già concesso si usa la posizione senza chiedere nulla
        const p = await navigator.permissions?.query({ name: 'geolocation' })
        if (p?.state === 'granted' && await store.useHere()) await store.load()
      } catch { /* nessun permesso noto: la scheda invita a scegliere il luogo */ }
    } else {
      await store.load()
    }
    const p = store.place
    if (p && !p.name) { try { store.setName(await reverseLabel(p.lat, p.lng)) } catch { /* resta «La tua posizione» */ } }
  }
  const retry = () => { store.clearFlags(); return store.load({ force: true }) }
  if (autoload) onMounted(init)

  return { store, state, offline, summary, placeName, savedLabel, retry }
}

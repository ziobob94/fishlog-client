// Dati meteo per la Home (scheda grande): stessa fonte e stessa cache della pagina Meteo.
// Il permesso si chiede solo al tocco su «Attiva la posizione» (o dalla pagina /meteo); all'avvio si usa solo se è già concesso. Se il dato in cache è recente non parte nessuna richiesta.
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useWeatherStore } from '../stores/weather.js'
import { useOnline } from './useOnline.js'
import { reverseLabel } from '../utils/places.js'
import { rowWmo, rowLabel, isDayAt, windInfo, pressureState } from '../utils/weather.js'

// Pausa tra due aggiornamenti manuali: la quota delle API meteo è limitata, il server comunque risponde dalla sua cache (~5 km).
export const REFRESH_COOLDOWN_MS = 30_000
const clock = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })

export function useHomeWeather() {
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
      temp: c.temp, feels: c.feelsLike, max: d.daily?.[0]?.tempMax ?? null, min: d.daily?.[0]?.tempMin ?? null,
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
  // Solo dal tocco su «Attiva la posizione»: è l'unico punto della Home che chiede il permesso.
  const activating = computed(() => store.status === 'loading' && !store.place)
  const denied = computed(() => store.status === 'denied' && !store.place)
  async function activate() {
    if (!(await store.useHere())) return
    await store.load({ force: true })
    const p = store.place
    if (p && !p.name) { try { store.setName(await reverseLabel(p.lat, p.lng)) } catch { /* resta «La tua posizione» */ } }
  }
  // Tasto «Aggiorna» della scheda: stesso meccanismo della pagina Meteo (load con force, la cache la gestisce il server) + breve anti-spam.
  const coolingDown = ref(false)
  let coolTimer = null
  const refreshing = computed(() => store.refreshing)
  const refreshFailed = computed(() => store.failed)
  async function refresh() {
    if (coolingDown.value || store.refreshing || offline.value || !store.place) return
    coolingDown.value = true
    clearTimeout(coolTimer); coolTimer = setTimeout(() => { coolingDown.value = false }, REFRESH_COOLDOWN_MS)
    store.clearFlags()
    await store.load({ force: true })
  }
  onBeforeUnmount(() => clearTimeout(coolTimer))
  const retry = () => { store.clearFlags(); return store.load({ force: true }) }
  onMounted(init)

  return { activate, activating, denied, store, state, offline, summary, placeName, savedLabel, retry, refresh, refreshing, refreshFailed, coolingDown }
}

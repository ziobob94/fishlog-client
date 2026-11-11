// Store del pannello Meteo e mare: luogo scelto («Qui» o cercato), ultimo dato e stato della richiesta.
// Il dato più recente per luogo resta in IndexedDB: offline si mostra quello con l'ora in evidenza.
// Quota Google: la Home non chiama il server se il dato in cache è recente (FRESH_MS); il server a sua volta
// raggruppa i luoghi vicini in celle da ~5 km.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'
import { getWeatherCache, putWeatherCache } from '../utils/offlineDb.js'
import { normalizeOverview } from '../utils/weather.js'

export const FRESH_MS = 15 * 60e3
const PLACE_KEY = 'fishlog_weather_place'
const cellKey = (lat, lng) => `${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`

// status: 'idle' | 'loading' | 'ok' | 'offline' | 'denied' | 'unavailable' | 'notfound' | 'error'
//   denied = permesso posizione negato · unavailable = posizione non trovata/non supportata · notfound = ricerca senza risultati
export const useWeatherStore = defineStore('weather', () => {
  const place = ref(null)       // { name, lat, lng, mode: 'here' | 'search' }
  const data = ref(null)        // risposta normalizzata
  const savedAt = ref(null)     // ms: quando è stato scaricato il dato mostrato
  const status = ref('idle')
  const fromCache = ref(false)
  const refreshing = ref(false)
  let inflight = 0

  const hasPlace = computed(() => !!place.value)
  const stale = computed(() => !savedAt.value || Date.now() - savedAt.value > FRESH_MS)

  try { const p = JSON.parse(localStorage.getItem(PLACE_KEY) || 'null'); if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) place.value = p } catch { /* niente luogo salvato */ }

  function setPlace(p) {
    place.value = p ? { name: p.name || '', lat: Number(p.lat), lng: Number(p.lng), mode: p.mode || 'search' } : null
    try { place.value ? localStorage.setItem(PLACE_KEY, JSON.stringify(place.value)) : localStorage.removeItem(PLACE_KEY) } catch { /* ignora */ }
  }

  // Mostra subito l'ultimo dato salvato per il luogo (senza rete).
  async function loadCached() {
    if (!place.value) return false
    try {
      const rec = await getWeatherCache(cellKey(place.value.lat, place.value.lng))
      if (rec?.data) { data.value = rec.data; savedAt.value = rec.savedAt; fromCache.value = true; return true }
    } catch { /* IndexedDB non disponibile */ }
    return false
  }

  // force=false: se il dato in cache è recente non fa nessuna chiamata (Home).
  async function load({ force = false } = {}) {
    if (!place.value) return
    if (!data.value) await loadCached()
    if (!force && data.value && !stale.value) { status.value = 'ok'; return }
    const mine = ++inflight
    if (data.value) refreshing.value = true; else status.value = 'loading'
    const { lat, lng } = place.value
    try {
      const { data: raw } = await api.get('/weather', { params: { lat, lon: lng } })
      if (mine !== inflight) return
      const view = normalizeOverview(raw)
      if (!view) throw new Error('empty')
      data.value = view; savedAt.value = Date.now(); fromCache.value = false; status.value = 'ok'
      putWeatherCache({ key: cellKey(lat, lng), place: place.value, data: view, savedAt: savedAt.value }).catch(() => {})
    } catch (e) {
      if (mine !== inflight) return
      const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || (!e?.response && e?.code !== 'ECONNABORTED')
      if (offline) status.value = data.value ? 'ok' : 'offline'
      else status.value = data.value ? 'ok' : 'error'
      if (offline && data.value) { fromCache.value = true; offlineNow.value = true } else if (!offline) failed.value = true
    } finally {
      if (mine === inflight) refreshing.value = false
    }
  }
  const offlineNow = ref(false)   // l'ultimo tentativo è fallito per mancanza di rete: mostra il banner «offline»
  const failed = ref(false)       // l'ultimo tentativo è fallito per errore del servizio ma c'è un dato vecchio

  function useHere() {
    return new Promise(resolve => {
      if (!navigator.geolocation) { status.value = 'unavailable'; resolve(false); return }
      status.value = 'loading'
      navigator.geolocation.getCurrentPosition(
        pos => { setPlace({ name: '', lat: pos.coords.latitude, lng: pos.coords.longitude, mode: 'here' }); data.value = null; savedAt.value = null; offlineNow.value = false; failed.value = false; resolve(true) },
        err => { status.value = err?.code === 1 ? 'denied' : 'unavailable'; resolve(false) },
        { timeout: 10000, maximumAge: 5 * 60e3 })
    })
  }
  function pickPlace(p) {
    setPlace({ ...p, mode: 'search' }); data.value = null; savedAt.value = null; offlineNow.value = false; failed.value = false
  }
  function setName(name) { if (place.value && name) setPlace({ ...place.value, name }) }
  function clearFlags() { offlineNow.value = false; failed.value = false }

  return { place, data, savedAt, status, fromCache, refreshing, offlineNow, failed, hasPlace, stale, setPlace, loadCached, load, useHere, pickPlace, setName, clearFlags }
})

// «Le mie località» della Home: lista sull'account (GET/PUT /me/favorite-places, lista intera ordinata)
// + meteo e mare di tutte le schede con una sola chiamata batch (cache 15 min). Offline: lista e schede dalla cache locale, in sola lettura.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'
import {
  MAX_FAVORITES, CARDS_FRESH_MS, addFavorite, removeFavorite, restoreFavorite, moveFavorite, sortFavorites,
  readListCache, writeListCache, readCardsCache, writeCardsCache,
} from '../utils/favorites.js'

export const HERE_ID = 'here'
const HERE_KEY = 'fishlog_favorites_here'
const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false

export const useFavoritesStore = defineStore('favorites', () => {
  const places = ref(readListCache() || [])
  const loaded = ref(false)        // la lista è arrivata (o è stata letta dalla cache)
  const loading = ref(false)
  const readOnly = ref(false)      // lista dalla cache locale: non si può modificare
  const cards = ref(readCardsCache())   // id → { ok, temp, wmo, …, savedAt }
  const cardsStatus = ref('idle')  // idle | loading | ok | offline | error
  let here = null
  try { here = JSON.parse(localStorage.getItem(HERE_KEY) || 'null') } catch { /* nessuna posizione nota */ }
  const hereSpot = ref(here && Number.isFinite(here.lat) && Number.isFinite(here.lon) ? here : null)

  const count = computed(() => places.value.length)
  const limitReached = computed(() => places.value.length >= MAX_FAVORITES)
  const findSame = (p) => places.value.find(f => Math.abs(f.lat - Number(p.lat)) < 0.001 && Math.abs(f.lon - Number(p.lon ?? p.lng)) < 0.001) || null

  function setHere(lat, lon) {
    hereSpot.value = { lat: Number(lat), lon: Number(lon) }
    try { localStorage.setItem(HERE_KEY, JSON.stringify(hereSpot.value)) } catch { /* ignora */ }
  }

  async function load() {
    loading.value = true
    try {
      const { data } = await api.get('/me/favorite-places')
      places.value = sortFavorites(data.places || []); readOnly.value = false
      writeListCache(places.value)
    } catch {
      const c = readListCache()
      if (c) places.value = c
      readOnly.value = true
    } finally { loading.value = false; loaded.value = true }
  }

  // Salva la lista intera. Ottimistico: se la richiesta fallisce torna com'era. → 'ok' | 'offline' | 'error'
  async function persist(next) {
    if (!isOnline() || readOnly.value) return 'offline'
    const prev = places.value
    places.value = next
    try {
      const { data } = await api.put('/me/favorite-places', { places: next })
      places.value = sortFavorites(data.places || next); writeListCache(places.value)
      return 'ok'
    } catch {
      places.value = prev
      return 'error'
    }
  }

  async function add(place) {
    const r = addFavorite(places.value, place)
    if (r.error) return r.error
    return persist(r.list)
  }
  // → { status, removed, index }: serve a «Annulla».
  async function remove(id) {
    const r = removeFavorite(places.value, id)
    if (!r.removed) return { status: 'missing' }
    return { status: await persist(r.list), removed: r.removed, index: r.index }
  }
  const undoRemove = (removed, index) => persist(restoreFavorite(places.value, removed, index))
  const move = (from, to) => persist(moveFavorite(places.value, from, to))
  // Nuovo ordine dato come lista di id (fine del trascinamento); id sconosciuti o mancanti lasciano tutto com'è.
  function reorder(ids) {
    const byId = new Map(places.value.map(p => [p.id, p]))
    if (ids.length !== byId.size || ids.some(id => !byId.has(id))) return 'missing'
    return persist(ids.map((id, i) => ({ ...byId.get(id), order: i })))
  }
  // Aggiunge o toglie lo stesso posto (stella). → 'added' | 'removed' | 'limit' | 'offline' | 'error'
  async function toggle(place) {
    const same = findSame(place)
    if (same) { const r = await remove(same.id); return r.status === 'ok' ? 'removed' : r.status }
    const s = await add(place)
    return s === 'ok' ? 'added' : s
  }

  // Meteo e mare delle schede: una chiamata per tutte quelle senza dato recente (force: tutte).
  // Se la rete manca o fallisce restano i dati salvati (con la loro ora) e lo stato dice perché.
  async function loadCards({ force = false } = {}) {
    const spots = [...(hereSpot.value ? [{ id: HERE_ID, ...hereSpot.value }] : []), ...places.value]
    if (!spots.length) { cardsStatus.value = 'ok'; return }
    const now = Date.now()
    const stale = spots.filter(s => force || !cards.value[s.id] || now - cards.value[s.id].savedAt > CARDS_FRESH_MS || !cards.value[s.id].ok)
    if (!stale.length) { cardsStatus.value = 'ok'; return }
    if (!isOnline()) { cardsStatus.value = 'offline'; return }
    if (!spots.some(s => cards.value[s.id])) cardsStatus.value = 'loading'
    try {
      const { data } = await api.post('/weather/batch', { places: stale.map(s => ({ id: s.id, lat: s.lat, lon: s.lon })) })
      const next = { ...cards.value }
      for (const r of data.results || []) {
        if (r.ok) next[r.id] = { ...r, savedAt: Date.now() }
        else if (!next[r.id]) next[r.id] = { id: r.id, ok: false, savedAt: Date.now() }
      }
      cards.value = next; writeCardsCache(next); cardsStatus.value = 'ok'
    } catch (e) {
      cardsStatus.value = (!e?.response || !isOnline()) ? 'offline' : 'error'
    }
  }
  const cardsAt = computed(() => Math.max(0, ...Object.values(cards.value).filter(c => c.ok).map(c => c.savedAt || 0)) || null)

  return { places, loaded, loading, readOnly, cards, cardsStatus, cardsAt, hereSpot, count, limitReached, findSame, setHere, load, add, remove, undoRemove, move, reorder, toggle, loadCards }
})

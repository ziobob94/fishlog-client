// Attività dei pesci «adesso» per la Home e le schede di «Le mie località»: una chiamata batch (POST /weather/activity, cache server 15 min).
// Ogni record: { id, ok, level|null, factors, nextWindow, date, hour, savedAt }. Offline si tengono gli ultimi dati con la loro ora.
// Le uscite dell'utente non entrano mai nel calcolo: tutto arriva dal server.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'
import { isStale } from '../utils/fishActivity.js'

const KEY = 'fishlog_fish_activity'
const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false
const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : {} } catch { return {} } }
const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* ignora */ } }

export const useFishActivityStore = defineStore('fishActivity', () => {
  const records = ref(read())   // id → record
  const loading = ref(false)

  // spots: [{ id, lat, lon }]. Chiede solo quelli senza dato recente (force: tutti). → 'ok' | 'offline' | 'error' | 'fresh'
  async function load(spots, { force = false } = {}) {
    const list = (spots || []).filter(s => s && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lon ?? s.lng)))
    const stale = list.filter(s => force || isStale(records.value[s.id]) || !sameSpot(records.value[s.id], s))
    if (!stale.length) return 'fresh'
    if (!isOnline()) return 'offline'
    if (!stale.some(s => records.value[s.id])) loading.value = true
    try {
      const { data } = await api.post('/weather/activity', { places: stale.map(s => ({ id: s.id, lat: Number(s.lat), lon: Number(s.lon ?? s.lng) })) })
      const next = { ...records.value }
      for (const r of data.results || []) {
        const s = stale.find(x => x.id === r.id)
        if (!s) continue
        if (r.ok) next[r.id] = { ...r, lat: Number(s.lat), lon: Number(s.lon ?? s.lng), savedAt: Date.now() }
        else if (!next[r.id]?.ok) next[r.id] = { id: r.id, ok: false, savedAt: Date.now() }
      }
      records.value = next; write(next)
      return 'ok'
    } catch (e) {
      return !e?.response || !isOnline() ? 'offline' : 'error'
    } finally { loading.value = false }
  }

  return { records, loading, load }
})

// Il record vale solo per lo stesso posto (l'id «sel» cambia luogo quando si sceglie un'altra località).
function sameSpot(rec, s) {
  if (!rec || rec.lat == null) return !rec ? false : true
  return Math.abs(rec.lat - Number(s.lat)) < 0.001 && Math.abs(rec.lon - Number(s.lon ?? s.lng)) < 0.001
}

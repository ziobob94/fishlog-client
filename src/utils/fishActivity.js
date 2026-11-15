// Attività dei pesci (stima indicativa) nella Home: parole dei livelli, fattori e stato della card. Funzioni pure.
// Il livello arriva dal server (1-5); qui non si calcola nulla e non si inventa mai un livello.
import { pressureState, hhmm } from './weather.js'

export const LEVELS = [1, 2, 3, 4, 5]
export const LEVEL_KEYS = { 1: 'low', 2: 'midLow', 3: 'mid', 4: 'midHigh', 5: 'high' }
export const FACTOR_KEYS = ['light', 'tide', 'pressure', 'wind', 'waterTemp']
export const EFFECT_ARROW = { up: '↑', flat: '→', down: '↓' }
export const FRESH_MS = 15 * 60e3

export const validLevel = n => (Number.isInteger(n) && n >= 1 && n <= 5 ? n : null)
export const levelKey = n => LEVEL_KEYS[validLevel(n)] || null

// I 3 pill: solo fattori noti, effetto valido, al massimo 3 (il server li manda già in ordine d'influenza).
export function visibleFactors(factors, max = 3) {
  return (Array.isArray(factors) ? factors : [])
    .filter(f => FACTOR_KEYS.includes(f?.key) && EFFECT_ARROW[f?.effect])
    .slice(0, max)
}

// Stato della card/scheda:
//  loading  → nessun dato e richiesta in corso (skeleton, aria-busy)
//  ok       → livello valido
//  offline  → livello salvato, ma senza rete (mostra l'ora dell'ultimo dato)
//  hidden   → il server dice che mancano i dati mare (reason 'no-marine'): la stima non ha senso, la scheda non si mostra
//  missing  → dati mancanti (server senza stima, luogo non raggiungibile, offline senza dato): nessun livello
export function activityState({ rec, loading = false, online = true }) {
  if (rec?.ok && rec.reason === 'no-marine') return 'hidden'
  if (!rec) return loading ? 'loading' : 'missing'
  if (!rec.ok || validLevel(rec.level) == null) return 'missing'
  return online ? 'ok' : 'offline'
}

// Il dato salvato è vecchio per il ricalcolo (i livelli sono «per ora», 15 min come la cache del server).
export const isStale = (rec, now = Date.now()) => !rec || !rec.ok || now - (rec.savedAt || 0) > FRESH_MS

export const clock = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })

// Riassunto a parole delle finestre, usato come testo alternativo del grafico.
export const windowsText = (windows, none) => (windows?.length ? windows.map(w => `${w.from}-${w.to}`).join(', ') : none)

// Dato concreto di un fattore, dalla stessa panoramica meteo del luogo (mai inventato): { id, params } con `id` chiave i18n
// sotto fishAct.factorData, oppure null se il dato manca (il componente ripiega sul testo generico).
const isNum = v => typeof v === 'number' && Number.isFinite(v)
const minutesOf = iso => { const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null }

export function factorDetail(key, view) {
  if (!view) return null
  if (key === 'pressure') {
    const p = view.fishing?.pressure
    const st = pressureState(p?.trend, p?.delta3h)
    return st.key ? { id: `pressure.${st.key}` } : null
  }
  if (key === 'wind') {
    const v = view.current?.windSpeed
    return isNum(v) ? { id: 'wind', params: { n: Math.round(v) } } : null
  }
  if (key === 'waterTemp') {
    const v = view.marine?.seaTemp
    return isNum(v) ? { id: 'waterTemp', params: { n: Math.round(v) } } : null
  }
  if (key === 'tide') {
    const series = view.marine?.tides?.series
    const now = view.hourly?.[0]?.time
    if (!Array.isArray(series) || typeof now !== 'string') return null
    const i = series.findIndex(x => String(x.time).slice(0, 13) === now.slice(0, 13))
    const a = series[i]?.height, b = series[i + 1]?.height
    if (!isNum(a) || !isNum(b)) return null
    const d = b - a
    return { id: `tide.${d > 0.02 ? 'rising' : d < -0.02 ? 'falling' : 'slack'}` }
  }
  if (key === 'light') {
    const d = view.daily?.[0]
    const hour = view.hourly?.[0]?.hour
    const rise = minutesOf(d?.sunrise), set = minutesOf(d?.sunset)
    if (!isNum(hour) || rise == null || set == null) return null
    const now = hour * 60
    if (now < rise) return { id: 'light.sunrise', params: { time: hhmm(d.sunrise) } }
    if (now < set) return { id: 'light.sunset', params: { time: hhmm(d.sunset) } }
    return { id: 'light.night' }
  }
  return null
}

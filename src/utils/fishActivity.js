// Attività dei pesci (stima indicativa) nella Home: parole dei livelli, fattori e stato della card. Funzioni pure.
// Il livello arriva dal server (1-5); qui non si calcola nulla e non si inventa mai un livello.
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
//  missing  → dati mancanti (server senza stima, luogo non raggiungibile, offline senza dato): nessun livello
export function activityState({ rec, loading = false, online = true }) {
  if (!rec) return loading ? 'loading' : 'missing'
  if (!rec.ok || validLevel(rec.level) == null) return 'missing'
  return online ? 'ok' : 'offline'
}

// Il dato salvato è vecchio per il ricalcolo (i livelli sono «per ora», 15 min come la cache del server).
export const isStale = (rec, now = Date.now()) => !rec || !rec.ok || now - (rec.savedAt || 0) > FRESH_MS

export const clock = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })

// Riassunto a parole delle finestre, usato come testo alternativo del grafico.
export const windowsText = (windows, none) => (windows?.length ? windows.map(w => `${w.from}-${w.to}`).join(', ') : none)

// Funzioni pure del pannello Meteo e mare: nessun accesso a rete, DOM o store, così sono testabili.
// Regola dei dati: un valore mancante è sempre «—» (mai 0).

import { wmoLabel } from '../components/weather-icons.js'

export const MISSING = '—'
export const isNum = v => typeof v === 'number' && Number.isFinite(v)

// Numero con le cifre richieste e virgola italiana; null/NaN → «—».
export function fmt(v, digits = 0) {
  if (!isNum(v)) return MISSING
  const n = digits > 0 ? v.toFixed(digits) : String(Math.round(v))
  return (n === '-0' ? '0' : n).replace('.', ',').replace('-', '−')
}
// Con segno esplicito (+0,21 / −0,18), per le altezze delle maree.
export function fmtSigned(v, digits = 2) {
  if (!isNum(v)) return MISSING
  const s = fmt(v, digits)
  return v > 0 && s !== fmt(0, digits) ? `+${s}` : s
}

// ── Vento ─────────────────────────────────────────────────────────────────────
const COMPASS = [
  ['N', 'nord'], ['NE', 'nord-est'], ['E', 'est'], ['SE', 'sud-est'],
  ['S', 'sud'], ['SO', 'sud-ovest'], ['O', 'ovest'], ['NO', 'nord-ovest'],
]
export function compass(deg) {
  if (!isNum(deg)) return null
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return { abbr: COMPASS[i][0], name: COMPASS[i][1] }
}
export const CALM_KMH = 2
// `deg` è la direzione DA CUI arriva il vento (convenzione meteo). La freccia punta dove soffia (deg + 180).
// Calmo (< 2 km/h) = pallino, nessuna freccia. Senza direzione nessuna freccia e nessun testo.
export function windInfo(speed, deg) {
  const c = compass(deg)
  const calm = isNum(speed) && speed < CALM_KMH
  if (calm) return { calm: true, arrow: null, from: null, abbr: null, name: null, deg: null }
  return {
    calm: false,
    arrow: c ? ((Math.round(deg) + 180) % 360 + 360) % 360 : null,
    from: c ? `da ${c.abbr} · ${Math.round(((deg % 360) + 360) % 360)}°` : null,
    abbr: c?.abbr ?? null, name: c?.name ?? null,
    deg: c ? Math.round(((deg % 360) + 360) % 360) : null,
  }
}
// Verso dove soffia, per i testi (es. corrente «verso S»).
export function headingTo(deg) { return isNum(deg) ? compass(deg + 180)?.abbr ?? null : null }

// ── Pressione ─────────────────────────────────────────────────────────────────
// Il server dà trend e delta a 3 h; qui si riducono a tre stati con parola, freccia e lettura prudente.
export function pressureState(trend, delta3h) {
  let key = null
  if (trend === 'in_calo' || trend === 'in_forte_calo') key = 'falling'
  else if (trend === 'stabile') key = 'steady'
  else if (trend === 'in_aumento' || trend === 'in_forte_aumento') key = 'rising'
  else if (isNum(delta3h)) key = delta3h <= -1 ? 'falling' : delta3h >= 1 ? 'rising' : 'steady'
  return {
    key,                                            // 'falling' | 'steady' | 'rising' | null (tendenza non disponibile)
    arrowDeg: key === 'falling' ? 35 : key === 'rising' ? -35 : 0, // rotazione dalla posizione «stabile» (→)
    strong: trend === 'in_forte_calo' || trend === 'in_forte_aumento',
    delta: isNum(delta3h) ? delta3h : null,
  }
}

// ── Luna ──────────────────────────────────────────────────────────────────────
export const MOON = {
  luna_nuova: 'Luna nuova', luna_crescente: 'Crescente', primo_quarto: 'Primo quarto', gibbosa_crescente: 'Gibbosa crescente',
  luna_piena: 'Luna piena', gibbosa_calante: 'Gibbosa calante', ultimo_quarto: 'Ultimo quarto', luna_calante: 'Calante',
}
export const moonLabel = phase => MOON[phase] ?? MISSING
export const percent = v => (isNum(v) ? `${Math.round(v * 100)}` : MISSING)

// ── Orari ─────────────────────────────────────────────────────────────────────
// Gli orari del server sono locali del luogo (Open-Meteo) o ISO con offset (Google): si legge HH:MM dal testo.
export function hhmm(iso) {
  const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : MISSING
}
const minutesOf = iso => { const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null }
// «10 h 03 min di luce»
export function daylight(sunrise, sunset) {
  const a = minutesOf(sunrise), b = minutesOf(sunset)
  if (a == null || b == null || b <= a) return null
  const d = b - a
  return { hours: Math.floor(d / 60), minutes: d % 60, label: `${Math.floor(d / 60)} h ${String(d % 60).padStart(2, '0')} min` }
}
export const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
export function dayLabel(date, today) {
  if (typeof date !== 'string') return MISSING
  if (date === today) return 'Oggi'
  const d = new Date(`${date}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? MISSING : WEEKDAYS[d.getUTCDay()]
}

// ── Condizioni (valori del server) ────────────────────────────────────────────
export const CONDITION = { sole: 'Sereno', nuvoloso: 'Poco nuvoloso', coperto: 'Nuvoloso', nebbia: 'Nebbia', pioggia: 'Pioggia', vento: 'Ventoso' }
export const conditionLabel = c => CONDITION[c] ?? MISSING
// Descrizione di Google (se c'è) altrimenti etichetta dell'app.
export const conditionText = (c, description) => (description && String(description).trim()) || conditionLabel(c)

export const uvLabel = uv => (!isNum(uv) ? null : uv < 3 ? 'basso' : uv < 6 ? 'moderato' : uv < 8 ? 'alto' : 'molto alto')

// ── Maree (stima dal modello) ─────────────────────────────────────────────────
// Prossimi n estremi dopo `nowIso` (confronto sul testo ISO locale, che è ordinabile).
export function nextTides(tides, nowIso, n = 4) {
  const ex = Array.isArray(tides?.extremes) ? tides.extremes : []
  const after = nowIso ? ex.filter(e => String(e.time) >= String(nowIso).slice(0, 16)) : ex
  return after.slice(0, n).map(e => ({ type: e.type, time: e.time, hhmm: hhmm(e.time), height: e.height }))
}
export function tideSummary(items) {
  return items.map(e => `${e.type === 'alta' ? 'alta' : 'bassa'} alle ${e.hhmm} (${fmtSigned(e.height, 2)} m)`).join(', ')
}

// ── Normalizzazione della risposta del server ─────────────────────────────────
// Garantisce una forma completa: i blocchi mancanti diventano oggetti vuoti, così i componenti non lanciano errori
// e ogni campo assente resta null (mai 0). `marine.available` decide se mostrare il blocco Mare.
const num = v => (isNum(v) ? v : null)
// Fonti conosciute di ogni riga; qualunque altra (dati vecchi o sconosciuti) vale «google» come prima.
const srcOf = v => (v === 'open-meteo' || v === 'icon-2i' ? v : 'google')
export function normalizeOverview(raw) {
  if (!raw || typeof raw !== 'object') return null
  const c = raw.current || {}
  const m = raw.marine || {}
  const f = raw.fishing || {}
  const p = f.pressure || {}
  const marine = {
    available: !!m.available,
    waveHeight: num(m.waveHeight), wavePeriod: num(m.wavePeriod), waveDeg: num(m.waveDeg),
    swellHeight: num(m.swellHeight), swellPeriod: num(m.swellPeriod), swellDeg: num(m.swellDeg),
    seaTemp: num(m.seaTemp), currentSpeed: num(m.currentSpeed), currentDeg: num(m.currentDeg),
    tides: m.tides && Array.isArray(m.tides.series) && m.tides.series.length ? m.tides : null,
    dailyWaveMax: Array.isArray(m.dailyWaveMax) ? m.dailyWaveMax : [],
    // altezza e periodo dell'onda ora per ora: servono al grafico (almeno 2 punti con altezza)
    waves: (Array.isArray(m.waves) ? m.waves : []).map(w => ({ time: w.time ?? null, height: num(w.height), period: num(w.period), seaTemp: num(w.seaTemp) })),
  }
  return {
    location: raw.location || null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    degraded: !!raw.degraded,   // il server ha fermato Google (quota): dati da cache o ripiego
    current: {
      condition: c.condition ?? null, wmo: num(c.wmo), description: c.description ?? null, isDay: typeof c.isDay === 'boolean' ? c.isDay : null,
      temp: num(c.temp), feelsLike: num(c.feelsLike), humidity: num(c.humidity), pressure: num(c.pressure),
      windSpeed: num(c.windSpeed), windGust: num(c.windGust), windDeg: num(c.windDeg),
      cloudCover: num(c.cloudCover), uvIndex: num(c.uvIndex), visibilityKm: num(c.visibilityKm),
      precipProbability: num(c.precipProbability), precipMm: num(c.precipMm),
    },
    hourly: (Array.isArray(raw.hourly) ? raw.hourly : []).map(h => ({
      time: h.time ?? null, date: typeof h.date === 'string' ? h.date : (typeof h.time === 'string' ? h.time.slice(0, 10) : null),
      hour: num(h.hour), source: srcOf(h.source), condition: h.condition ?? null, wmo: num(h.wmo), temp: num(h.temp),
      precipProbability: num(h.precipProbability), precipMm: num(h.precipMm), windSpeed: num(h.windSpeed), windGust: num(h.windGust), windDeg: num(h.windDeg), pressure: num(h.pressure),
    })),
    daily: (Array.isArray(raw.daily) ? raw.daily : []).map(d => ({
      date: d.date ?? null, source: srcOf(d.source), condition: d.condition ?? null, wmo: num(d.wmo), tempMax: num(d.tempMax), tempMin: num(d.tempMin),
      precipProbability: num(d.precipProbability), precipSum: num(d.precipSum), windSpeed: num(d.windSpeed), windGust: num(d.windGust),
      sunrise: d.sunrise ?? null, sunset: d.sunset ?? null, moonPhase: d.moonPhase ?? null,
      activity: d.activity && num(d.activity.level) != null ? { level: d.activity.level, label: d.activity.label ?? null, score: num(d.activity.score) } : null,
      waveHeightMax: num(marine.dailyWaveMax.find(w => w.date === d.date)?.waveHeightMax),
    })),
    marine,
    fishing: {
      moon: { phase: f.moon?.phase ?? null, illumination: num(f.moon?.illumination), age: num(f.moon?.age) },
      sunrise: f.sunrise ?? null, sunset: f.sunset ?? null,
      pressure: { value: num(p.value), trend: p.trend ?? null, delta3h: num(p.delta3h), history6h: Array.isArray(p.history6h) ? p.history6h.filter(isNum) : [] },
    },
    sources: raw.sources || {},
  }
}
// True se l'overview usa dati ICON-2I (Italia Meteo / ARPAE-SIMC, CC BY 4.0): in quel caso va mostrata l'attribuzione.
export const usesIcon2i = view => String(view?.sources?.weather || '').includes('icon-2i')
// Quanti campi principali ha l'«Adesso»: serve a segnalare i dati parziali.
export function isPartial(view) {
  if (!view) return false
  const c = view.current
  return [c.temp, c.windSpeed, c.pressure, c.humidity].some(v => v == null)
}

// Serie dell'onda per il grafico: solo i punti con altezza; vuota se ce ne sono meno di 2. Restituisce anche massimo e istante del massimo.
export function waveSeries(waves) {
  const pts = (Array.isArray(waves) ? waves : []).filter(w => isNum(w?.height))
  if (pts.length < 2) return { points: [], max: null, maxTime: null, maxIndex: -1 }
  let maxIndex = 0
  pts.forEach((p, i) => { if (p.height > pts[maxIndex].height) maxIndex = i })
  return { points: pts, max: pts[maxIndex].height, maxTime: pts[maxIndex].time, maxIndex }
}

// ── Ore raggruppate per giorno ────────────────────────────────────────────────
// Il server dà fino a 168 ore con `date` locale: qui si raggruppano per giorno, nell'ordine ricevuto.
// `extended` è true se il giorno contiene ore da Open-Meteo (oltre le prime 48 ore di Google).
export function groupHoursByDay(hourly) {
  const days = []
  for (const h of Array.isArray(hourly) ? hourly : []) {
    if (!h?.date) continue
    let d = days[days.length - 1]
    if (!d || d.date !== h.date) { d = { date: h.date, rows: [], extended: false }; days.push(d) }
    d.rows.push(h)
    if (h.source === 'open-meteo') d.extended = true
  }
  return days
}
// Indice della prima riga che non viene da Google (per il divisore «da qui, Open-Meteo»); -1 se tutte da Google.
export function firstExtendedIndex(rows) {
  return (Array.isArray(rows) ? rows : []).findIndex(r => r?.source === 'open-meteo')
}

// ── Icone e testi delle condizioni (codici WMO) ───────────────────────────────
// Il server dà `wmo`; i dati salvati prima di questa versione hanno solo `condition`: se ne ricava un codice approssimato.
const CONDITION_WMO = { sole: 0, nuvoloso: 2, coperto: 3, nebbia: 45, pioggia: 63, vento: null }
export const rowWmo = r => (isNum(r?.wmo) ? r.wmo : (CONDITION_WMO[r?.condition] ?? null))
// Testo della condizione: la descrizione di Google se c'è, altrimenti l'etichetta del codice WMO.
export const rowLabel = (r, description) => (description && String(description).trim()) || wmoLabel(rowWmo(r))
// Giorno o notte per un'ora (0-23) dato alba e tramonto ISO locali; senza dati → giorno.
export function isDayAt(hour, sunrise, sunset) {
  const a = minutesOf(sunrise), b = minutesOf(sunset)
  if (!isNum(hour) || a == null || b == null) return true
  const m = hour * 60 + 30
  return m >= a && m < b
}

// ── Prossimi 7 / 15 giorni ────────────────────────────────────────────────────
export const DAYS_KEY = 'fishlog.weather.days'
export const DAY_CHOICES = [7, 15]
export const LESS_RELIABLE_FROM = 7   // dal giorno 8 (indice 7) la previsione è «meno affidabile» e mancano onde e attività
export function readDays(storage = typeof localStorage === 'undefined' ? null : localStorage) {
  try { const v = Number(storage?.getItem(DAYS_KEY)); return DAY_CHOICES.includes(v) ? v : 7 } catch { return 7 }
}
export function saveDays(n, storage = typeof localStorage === 'undefined' ? null : localStorage) {
  try { if (DAY_CHOICES.includes(n)) storage?.setItem(DAYS_KEY, String(n)) } catch { /* localStorage non disponibile */ }
}
const nums = a => a.filter(isNum)
const minOf = a => { const n = nums(a); return n.length ? Math.min(...n) : null }
const maxOf = a => { const n = nums(a); return n.length ? Math.max(...n) : null }
// Riepilogo del periodo scelto: minimi, massimi e totali. Un dato che manca in tutti i giorni resta null (mai 0);
// `rainPartial` dice che nel totale mancano alcuni giorni. L'onda conta solo i giorni entro 7 (poi non c'è il dato).
export function periodSummary(daily, n = 7) {
  const rows = (Array.isArray(daily) ? daily : []).slice(0, n)
  const rain = nums(rows.map(d => d.precipSum))
  return {
    count: rows.length,
    tempMin: minOf(rows.map(d => d.tempMin)),
    tempMax: maxOf(rows.map(d => d.tempMax)),
    rainTotal: rain.length ? Number(rain.reduce((a, b) => a + b, 0).toFixed(1)) : null,
    rainPartial: rain.length > 0 && rain.length < rows.length,
    rainDays: rows.some(d => isNum(d.precipSum) || isNum(d.precipProbability)) ? rows.filter(d => (isNum(d.precipSum) ? d.precipSum >= 1 : (d.precipProbability ?? 0) >= 50)).length : null,
    windMax: maxOf(rows.map(d => d.windSpeed)),
    waveMax: maxOf(rows.slice(0, LESS_RELIABLE_FROM).map(d => d.waveHeightMax)),
  }
}
// Affidabilità del giorno (0 = oggi): alta fino al 3º giorno, media fino al 7º, bassa oltre.
export const reliability = i => (i <= 2 ? 'high' : i < LESS_RELIABLE_FROM ? 'medium' : 'low')
// Barre min-max in percentuale della scala del periodo (per il grafico del riepilogo).
export function tempBars(daily, n = 7) {
  const rows = (Array.isArray(daily) ? daily : []).slice(0, n)
  const lo = minOf(rows.map(d => d.tempMin)), hi = maxOf(rows.map(d => d.tempMax))
  if (lo == null || hi == null) return rows.map(() => null)
  const span = Math.max(hi - lo, 1)
  return rows.map(d => (isNum(d.tempMin) && isNum(d.tempMax) ? { from: ((d.tempMin - lo) / span) * 100, to: ((d.tempMax - lo) / span) * 100 } : null))
}

// ── Dettaglio del giorno ──────────────────────────────────────────────────────
export const BANDS = [['night', 0, 6], ['morning', 6, 12], ['afternoon', 12, 18], ['evening', 18, 24]]
const meanOf = a => { const n = nums(a); return n.length ? n.reduce((x, y) => x + y, 0) / n.length : null }
export const hoursOfDay = (view, date) => (view?.hourly || []).filter(h => h.date === date)
export const wavesOfDay = (marine, date) => (marine?.waves || []).filter(w => typeof w.time === 'string' && w.time.startsWith(date))
// Maree del giorno: solo la serie e i massimi/minimi di quella data.
export function tidesOfDay(marine, date) {
  const t = marine?.tides
  if (!t) return null
  const series = t.series.filter(s => typeof s.time === 'string' && s.time.startsWith(date))
  if (series.length < 4) return null
  return { ...t, series, extremes: (t.extremes || []).filter(e => typeof e.time === 'string' && e.time.startsWith(date)) }
}
// Quattro fasce con temperatura media, vento massimo, pioggia (probabilità massima) e onda media: null se manca il dato.
export function dayBands(rows, waves = []) {
  return BANDS.map(([key, from, to]) => {
    const r = rows.filter(h => isNum(h.hour) && h.hour >= from && h.hour < to)
    const w = waves.filter(x => { const h = Number(String(x.time).slice(11, 13)); return h >= from && h < to })
    const mid = r.find(h => h.hour === from + 3) || r[Math.floor(r.length / 2)]
    return {
      key, from, to, wmo: mid ? rowWmo(mid) : null, isNight: key === 'night' || key === 'evening',
      temp: meanOf(r.map(h => h.temp)), wind: maxOf(r.map(h => h.windSpeed)), windDeg: r.length ? (r.find(h => isNum(h.windDeg))?.windDeg ?? null) : null,
      rain: maxOf(r.map(h => h.precipProbability)), wave: meanOf(w.map(x => x.height)),
    }
  })
}
// Pressione del giorno: punti, minimo (con l'ora) e andamento in parole-chiave.
export function pressureDay(rows) {
  const pts = rows.filter(h => isNum(h.pressure) && isNum(h.hour)).map(h => ({ hour: h.hour, value: h.pressure }))
  if (pts.length < 4) return null
  let mi = 0
  pts.forEach((p, i) => { if (p.value < pts[mi].value) mi = i })
  const first = pts[0].value, last = pts[pts.length - 1].value, min = pts[mi].value
  const down = first - min, up = last - min
  const shape = down >= 1 && up >= 1 && mi > 0 && mi < pts.length - 1 ? 'fallRise' : last - first <= -1 ? 'falling' : last - first >= 1 ? 'rising' : 'steady'
  return { points: pts, min, minHour: pts[mi].hour, shape }
}
// Le ultime `n` ore a partire da `nowIso` (YYYY-MM-DDTHH:MM): i grafici di mare e maree del pannello restano a 48 h anche se il server dà 7 giorni.
export function fromNow(series, nowIso, n = 48) {
  const a = Array.isArray(series) ? series : []
  if (!nowIso) return a.slice(0, n)
  const key = String(nowIso).slice(0, 13)
  const i = a.findIndex(x => String(x.time).slice(0, 13) >= key)
  return a.slice(Math.max(i, 0), Math.max(i, 0) + n)
}
// Il dettaglio è disponibile (orario, mare, pressione, attività) solo entro 7 giorni.
export const hasHourlyDetail = (view, date) => {
  const i = (view?.daily || []).findIndex(d => d.date === date)
  // Per oggi il server dà solo le ore da quella corrente in poi (la sera ne restano poche): basta qualche ora per mostrare il grafico.
  return i >= 0 && i < LESS_RELIABLE_FROM && hoursOfDay(view, date).length >= 1
}

// ── Striscia oraria continua ──────────────────────────────────────────────────
// Dalle ore ricevute (la prima è l'ora corrente) costruisce un'unica sequenza di `n` ore con:
//  - una colonna divisore («Gio 12») quando cambia il giorno, anche all'inizio;
//  - alba e tramonto come marcatore `sun` sulla colonna dell'ora in cui avvengono, con `frac` = minuti/60 per posizionarlo (orari locali, da daily.sunrise/sunset).
export function buildHourStream(view, n = 24) {
  const hours = (Array.isArray(view?.hourly) ? view.hourly : []).filter(h => h?.date && isNum(h.hour)).slice(0, n)
  const events = new Map()
  for (const d of Array.isArray(view?.daily) ? view.daily : []) {
    for (const [kind, iso] of [['sunrise', d.sunrise], ['sunset', d.sunset]]) {
      const m = typeof iso === 'string' && iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
      if (m) events.set(`${m[1]}T${m[2]}`, { type: kind, time: `${m[2]}:${m[3]}`, date: m[1], frac: Number(m[3]) / 60 })
    }
  }
  const out = []
  let lastDate = null
  hours.forEach((h, i) => {
    if (h.date !== lastDate) { out.push({ type: 'day', date: h.date, key: `day-${h.date}` }); lastDate = h.date }
    const sun = events.get(`${h.date}T${String(h.hour).padStart(2, '0')}`) || null
    out.push({ type: 'hour', row: h, key: h.time || `h-${i}`, sun })
  })
  return out
}

// ── Luna di un giorno qualsiasi (stessa formula del server, precisione ±~1 giorno) ──
const SYNODIC = 29.530588853
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14)
const MOON_NAMES = ['luna_nuova', 'luna_crescente', 'primo_quarto', 'gibbosa_crescente', 'luna_piena', 'gibbosa_calante', 'ultimo_quarto', 'luna_calante']
export function moonOn(date) {
  const t = Date.parse(`${date}T12:00:00Z`)
  if (Number.isNaN(t)) return { phase: null, illumination: null }
  const age = (((t - NEW_MOON_REF) / 86400e3) % SYNODIC + SYNODIC) % SYNODIC
  const frac = age / SYNODIC
  return { phase: MOON_NAMES[Math.floor(frac * 8 + 0.5) % 8], illumination: Number(((1 - Math.cos(2 * Math.PI * frac)) / 2).toFixed(2)) }
}
// «Venerdì 13 novembre» da 'YYYY-MM-DD'.
const LONG_DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
export function longDate(date) {
  const d = new Date(`${date}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? MISSING : `${LONG_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

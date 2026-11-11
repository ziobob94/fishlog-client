// Funzioni pure del pannello Meteo e mare: nessun accesso a rete, DOM o store, così sono testabili.
// Regola dei dati: un valore mancante è sempre «—» (mai 0).

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
    waves: (Array.isArray(m.waves) ? m.waves : []).map(w => ({ time: w.time ?? null, height: num(w.height), period: num(w.period) })),
  }
  return {
    location: raw.location || null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    degraded: !!raw.degraded,   // il server ha fermato Google (quota): dati da cache o ripiego
    current: {
      condition: c.condition ?? null, description: c.description ?? null, isDay: typeof c.isDay === 'boolean' ? c.isDay : null,
      temp: num(c.temp), feelsLike: num(c.feelsLike), humidity: num(c.humidity), pressure: num(c.pressure),
      windSpeed: num(c.windSpeed), windGust: num(c.windGust), windDeg: num(c.windDeg),
      cloudCover: num(c.cloudCover), uvIndex: num(c.uvIndex), visibilityKm: num(c.visibilityKm),
      precipProbability: num(c.precipProbability), precipMm: num(c.precipMm),
    },
    hourly: (Array.isArray(raw.hourly) ? raw.hourly : []).map(h => ({
      time: h.time ?? null, date: typeof h.date === 'string' ? h.date : (typeof h.time === 'string' ? h.time.slice(0, 10) : null),
      hour: num(h.hour), source: h.source === 'open-meteo' ? 'open-meteo' : 'google', condition: h.condition ?? null, temp: num(h.temp),
      precipProbability: num(h.precipProbability), windSpeed: num(h.windSpeed), windDeg: num(h.windDeg),
    })),
    daily: (Array.isArray(raw.daily) ? raw.daily : []).map(d => ({
      date: d.date ?? null, source: d.source === 'open-meteo' ? 'open-meteo' : 'google', condition: d.condition ?? null, tempMax: num(d.tempMax), tempMin: num(d.tempMin),
      precipProbability: num(d.precipProbability), windSpeed: num(d.windSpeed),
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

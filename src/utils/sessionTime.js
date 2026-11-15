// Orario di inizio di un'uscita (data + ora di inizio se indicata, altrimenti creazione)
export function sessionStart(s) {
  if (s?.date && s?.startTime) {
    const d = new Date(s.date)
    const [h, m] = s.startTime.split(':').map(Number)
    d.setHours(h || 0, m || 0, 0, 0)
    return d
  }
  return new Date(s?.createdAt || s?.date || Date.now())
}

export const fmtClock = d => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })

const toMinutes = hhmm => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const dayOf = v => (v ? String(v).slice(0, 10) : '')

// Giorni di scarto tra `date` ed `endDate` (0 se manca o se non è dopo l'inizio)
export function extraDays(s) {
  const a = Date.parse(dayOf(s?.date)), b = Date.parse(dayOf(s?.endDate))
  return Number.isNaN(a) || Number.isNaN(b) ? 0 : Math.max(0, Math.round((b - a) / 86400000))
}

// Durata in minuti di un'uscita con inizio e fine indicati, oppure null.
// Con `endDate` conta i giorni interi (uscite di più giorni); senza, una fine prima dell'inizio
// vale «il giorno dopo» (pescata notturna). Mai negativa.
export function sessionMinutes(s) {
  const a = toMinutes(s?.startTime), b = toMinutes(s?.endTime)
  if (a == null || b == null) return null
  const days = s?.endDate ? extraDays(s) : (b < a ? 1 : 0)
  return Math.max(0, days * 1440 + b - a)
}

// «ore a pesca» h:mm: dall'inizio a adesso (in corso) o alla fine indicata (chiusa)
export function elapsedLabel(s, now = Date.now()) {
  let mins = s?.status === 'closed' && s?.endTime && s?.date ? sessionMinutes(s) : null
  if (mins == null) {
    // Senza ora di inizio: dalla creazione, fino a adesso o all'ora di fine (lo stesso giorno o il giorno dopo)
    const start = sessionStart(s).getTime()
    let end = now
    if (s?.status === 'closed' && s?.endTime && s?.date) {
      const d = new Date(s.date); const [h, m] = s.endTime.split(':').map(Number)
      d.setHours(h || 0, m || 0, 0, 0); end = d.getTime()
      if (end < start) end += 86400000
    }
    mins = Math.max(0, Math.floor((end - start) / 60000))
  }
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
}

export const totalKgLabel = catches =>
  (Math.round((catches || []).reduce((s, c) => s + (Number(c.weightKg) || 0), 0) * 10) / 10).toFixed(1).replace('.', ',')

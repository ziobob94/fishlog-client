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

// «ore a pesca» h:mm: dall'inizio a adesso (in corso) o alla fine indicata (chiusa)
export function elapsedLabel(s, now = Date.now()) {
  const start = sessionStart(s).getTime()
  let end = now
  if (s?.status === 'closed' && s?.endTime && s?.date) {
    const d = new Date(s.date); const [h, m] = s.endTime.split(':').map(Number)
    d.setHours(h || 0, m || 0, 0, 0); end = d.getTime()
    if (end < start) end += 86400000
  }
  const mins = Math.max(0, Math.floor((end - start) / 60000))
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
}

export const totalKgLabel = catches =>
  (Math.round((catches || []).reduce((s, c) => s + (Number(c.weightKg) || 0), 0) * 10) / 10).toFixed(1).replace('.', ',')

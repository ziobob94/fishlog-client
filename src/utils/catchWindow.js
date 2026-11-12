// Fascia oraria di un'uscita conclusa e controllo dell'ora di una cattura.
const toMin = hhmm => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// { ok: true } oppure { ok: false, side: 'after' | 'before', time } dove `time` è l'ora
// a cui estendere l'uscita (fine se 'after', inizio se 'before').
// Nessun controllo se manca l'ora della cattura o uno dei due estremi dell'uscita.
export function checkCatchTime(session, time) {
  const t = toMin(time), s = toMin(session?.startTime), e = toMin(session?.endTime)
  if (t == null || s == null || e == null || session?.status === 'ongoing') return { ok: true }
  if (e >= s) {
    if (t > e) return { ok: false, side: 'after', time }
    if (t < s) return { ok: false, side: 'before', time }
    return { ok: true }
  }
  // fascia a cavallo della mezzanotte
  if (t >= s || t <= e) return { ok: true }
  return t - e <= s - t ? { ok: false, side: 'after', time } : { ok: false, side: 'before', time }
}

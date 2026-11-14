// Catture a voce: utilità pure (testabili) usate da VoiceCatch.vue e dallo store delle uscite.

const fmt = n => String(n).replace('.', ',')

// «Spigola · 2,5 kg · 55 cm · rilasciata»
export function summarizeCatch(c, releasedLabel = 'rilasciata') {
  if (!c) return ''
  const parts = [c.species]
  if (c.weightKg) parts.push(`${fmt(c.weightKg)} kg`)
  if (c.lengthCm) parts.push(`${fmt(c.lengthCm)} cm`)
  if (c.released) parts.push(releasedLabel)
  return parts.filter(Boolean).join(' · ')
}

// Pulisce il testo riconosciuto prima dell'invio (spazi, limite del server).
export function cleanTranscript(s, max = 600) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

// Aggiunge le catture appena salvate a una sessione, senza duplicare quelle già presenti.
export function withCatches(session, added) {
  if (!session || !added?.length) return session
  const have = new Set((session.catches || []).map(c => c._id).filter(Boolean))
  const fresh = added.filter(c => !have.has(c._id))
  return fresh.length ? { ...session, catches: [...(session.catches || []), ...fresh], totalCatches: (session.catches?.length || 0) + fresh.length } : session
}

export function withoutCatch(session, catchId) {
  if (!session) return session
  const catches = (session.catches || []).filter(c => c._id !== catchId)
  return { ...session, catches, totalCatches: catches.length }
}

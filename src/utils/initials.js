// Iniziali per gli avatar: due parole danno le due iniziali ("Mario Rossi" → MR),
// una sola parola o un nickname ("giorgio.r", "luca_bolentino") dà le prime
// due lettere dei segmenti ("GR", "LB"), come nel design.
export function toInitials(name) {
  const parts = String(name || '?').split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0] || '?').slice(0, 2).toUpperCase()
}

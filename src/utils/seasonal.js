// Helper puri per la scheda «In stagione» della ricerca specie.
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
export const monthName = (m) => MONTHS[(m - 1 + 12) % 12]
export const monthShort = (m) => monthName(m).slice(0, 3)

// Intervalli di mesi consecutivi con curva >= soglia, es. «giugno–settembre» (gestisce il passaggio d'anno).
export function bestRanges(season, threshold = 0.8) {
  const hi = season.map(v => v >= threshold)
  if (hi.every(Boolean)) return ['tutto l\'anno']
  if (!hi.some(Boolean)) return []
  const start = hi.findIndex((v, i) => v && !hi[(i + 11) % 12])
  const out = []
  for (let k = 0; k < 12; k++) {
    const i = (start + k) % 12
    if (!hi[i]) continue
    let j = i
    while (hi[(j + 1) % 12] && (j + 1) % 12 !== start) { j = (j + 1) % 12; k++ }
    out.push(i === j ? MONTHS[i] : `${MONTHS[i]}–${MONTHS[j]}`)
  }
  return out
}

// Testo alternativo della barra a 12 mesi.
export function seasonAlt(name, season, month, label) {
  const best = bestRanges(season)
  return `${name}: ${label} a ${monthName(month)}.` + (best.length ? ` Periodo migliore: ${best.join(', ')}.` : '')
}

export const clockLabel = (ms) => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })

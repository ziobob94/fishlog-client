// Logica pura della classifica catture: la stessa che applica il server
// (GET /users/:id/catches), qui per tenere la lista già caricata coerente
// quando si cambia ordinamento o specie prima che arrivi la risposta.

export const SORTS = ['weight', 'length', 'species']

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// Decrescente, con i valori mancanti sempre in fondo; a parità, la più recente prima.
function byValueDesc(field) {
  return (a, b) => {
    const x = num(a[field]), y = num(b[field])
    if (x === null && y === null) return new Date(b.date) - new Date(a.date)
    if (x === null) return 1
    if (y === null) return -1
    return y - x || new Date(b.date) - new Date(a.date)
  }
}

export const normSpecies = s => String(s || '').trim().toLowerCase()

export function filterBySpecies(catches, species) {
  const key = normSpecies(species)
  return key ? catches.filter(c => normSpecies(c.species) === key) : [...catches]
}

export function rankCatches(catches, { sort = 'weight', species = '' } = {}) {
  const list = filterBySpecies(catches, species)
  const field = sort === 'length' ? 'lengthCm' : 'weightKg'
  return list.sort(byValueDesc(field))
}

// Per specie: record e numero di catture, ordinate per numero di catture.
export function groupBySpecies(catches) {
  const map = new Map()
  for (const c of catches) {
    const key = normSpecies(c.species)
    const g = map.get(key) || { species: c.species, count: 0, recordWeightKg: null, recordLengthCm: null }
    g.count++
    if (num(c.weightKg) !== null && (g.recordWeightKg === null || c.weightKg > g.recordWeightKg)) g.recordWeightKg = c.weightKg
    if (num(c.lengthCm) !== null && (g.recordLengthCm === null || c.lengthCm > g.recordLengthCm)) g.recordLengthCm = c.lengthCm
    map.set(key, g)
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.species.localeCompare(b.species))
}

export function summarize(catches) {
  const weights = catches.map(c => num(c.weightKg)).filter(v => v !== null)
  return {
    catches: catches.length,
    species: new Set(catches.map(c => normSpecies(c.species))).size,
    maxWeightKg: weights.length ? Math.max(...weights) : null,
    record: catches.length ? rankCatches(catches, { sort: 'weight' }).find(c => num(c.weightKg) !== null) || null : null
  }
}

// 3,2 (virgola, una cifra) per pesi; interi per cm. null → «–».
export const fmtKg = v => (num(v) === null ? '–' : v.toFixed(1).replace('.', ','))
export const fmtCm = v => (num(v) === null ? '–' : String(Math.round(v)))

import api from '../utils/api.js'

export function useSpecies() {

  async function fetchSuggestions({ lat, lng, region } = {}) {
    const params = {}
    if (lat != null && lng != null) { params.lat = lat; params.lng = lng }
    else if (region) params.region = region
    // Nessuna posizione: il backend risponde comunque con un fallback
    // di specie comuni a livello globale.

    const { data } = await api.get('/species/suggestions', { params })
    return data.data || []
  }

  async function searchSpecies(q) {
    if (!q || q.trim().length < 2) return []
    const { data } = await api.get('/species/search', { params: { q: q.trim() } })
    return data.data || []
  }

  async function reportMissingSpecies(query, note) {
    const { data } = await api.post('/species/report', { query, note })
    return data
  }

  // Scheda specie pubblica: dati del catalogo + calendario/esche/tecniche
  // calcolati dalle catture reali. Ritorna null se la specie non è ancora
  // in catalogo (il chiamante mostra lo stato "non trovata" + segnalazione).
  async function fetchSpeciesByName(name) {
    try {
      const { data } = await api.get(`/species/name/${encodeURIComponent(name)}`)
      return data
    } catch (e) {
      if (e.response?.status === 404) return null
      throw e
    }
  }

  return { fetchSuggestions, searchSpecies, reportMissingSpecies, fetchSpeciesByName }
}

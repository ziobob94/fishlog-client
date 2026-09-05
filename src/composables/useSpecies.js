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

  return { fetchSuggestions, searchSpecies, reportMissingSpecies }
}

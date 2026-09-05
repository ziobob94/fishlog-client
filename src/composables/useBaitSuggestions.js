import api from '../utils/api.js'

export function useBaitSuggestions() {
  async function fetchBaitSuggestions() {
    const { data } = await api.get('/sessions/bait-suggestions')
    return data.data || []
  }

  // Nome + tipo (naturale/artificiale/misto) delle esche standard, per
  // auto-compilare il campo "Tipo esca" quando l'utente ne sceglie una nota.
  async function fetchBaitCatalog() {
    const { data } = await api.get('/sessions/bait-catalog')
    return data.data || []
  }

  return { fetchBaitSuggestions, fetchBaitCatalog }
}

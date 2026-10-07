import api from '../utils/api.js'

export function useRegulations() {
  async function fetchRegulations({ species, region } = {}) {
    const params = {}
    if (species) params.species = species
    if (region) params.region = region
    const { data } = await api.get('/regulations', { params })
    return data.data || []
  }

  return { fetchRegulations }
}

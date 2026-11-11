// Condizioni meteo-marine attuali per una coppia di coordinate. Il meteo arriva dal server
// (Google Weather API, chiave solo lato server) e il mare da Open-Meteo, sempre tramite
// GET /api/weather/current. Serve solo l'istante presente, per un widget di sola lettura.
import api from '../utils/api.js'

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

function degToCompass(deg) {
  if (deg == null) return null
  return COMPASS[Math.round(deg / 22.5) % 16]
}

export function useLiveConditions() {
  async function fetchLiveConditions(lat, lng) {
    try {
      const { data: w } = await api.get('/weather/current', { params: { lat, lng } })
      if (!w || (w.tempAir == null && w.windSpeed == null && w.pressure == null)) return null
      return {
        tempAir: w.tempAir ?? null,
        windSpeed: w.windSpeed ?? null,
        windDirection: degToCompass(w.windDeg),
        pressure: w.pressure ?? null,
        waveHeight: w.waveHeight ?? null,
        waterTemp: w.waterTemp ?? null
      }
    } catch {
      return null
    }
  }

  return { fetchLiveConditions }
}

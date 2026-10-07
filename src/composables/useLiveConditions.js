// Condizioni meteo-marine attuali per una coppia di coordinate, via
// Open-Meteo (gratuita, nessuna chiave richiesta) — chiamata diretta dal
// browser, stesso principio del reverse/forward geocoding già in uso in
// SessionForm. A differenza dell'autofill del form (che recupera anche dati
// storici per la data della sessione), qui serve solo l'istante presente,
// per un widget di sola lettura ("come sono le condizioni ora").
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

function degToCompass(deg) {
  if (deg == null) return null
  return COMPASS[Math.round(deg / 22.5) % 16]
}

export function useLiveConditions() {
  async function fetchLiveConditions(lat, lng) {
    try {
      const [weatherRes, marineRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure&wind_speed_unit=kmh&timezone=auto`),
        // Fuori mare l'API marina non ha dati: non deve far fallire il resto.
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_period,sea_surface_temperature&timezone=auto`).catch(() => null)
      ])
      if (!weatherRes.ok) return null
      const weather = await weatherRes.json()
      const marine = marineRes?.ok ? await marineRes.json() : null
      if (!weather?.current) return null

      return {
        tempAir: weather.current.temperature_2m ?? null,
        windSpeed: weather.current.wind_speed_10m ?? null,
        windDirection: degToCompass(weather.current.wind_direction_10m),
        pressure: weather.current.surface_pressure ?? null,
        waveHeight: marine?.current?.wave_height ?? null,
        waterTemp: marine?.current?.sea_surface_temperature ?? null
      }
    } catch {
      return null
    }
  }

  return { fetchLiveConditions }
}

// Ricerca e nomi di luogo (Nominatim/OpenStreetMap, senza chiavi).
// Lingua: italiano, ripiego inglese: così un luogo senza nome italiano esce in alfabeto
// latino («Kanazawa») e non nella scrittura locale («金沢市»).
const BASE = 'https://nominatim.openstreetmap.org'
export const GEO_LANG = 'it,en'

export async function searchPlaceOptions(q, limit = 5) {
  try {
    const r = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&accept-language=${GEO_LANG}&addressdetails=0`)
    const data = await r.json()
    return data.map(d => {
      const parts = String(d.display_name).split(',').map(x => x.trim())
      return { title: parts[0], sub: parts.slice(1, 3).join(', '), name: parts[0], lat: parseFloat(d.lat), lng: parseFloat(d.lon) }
    })
  } catch { return [] }
}

// Nome breve (città/paese/località) per un punto.
export async function reverseLabel(lat, lng) {
  try {
    const r = await fetch(`${BASE}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&accept-language=${GEO_LANG}`)
    const a = (await r.json()).address || {}
    return a.city || a.town || a.village || a.hamlet || a.suburb || a.county || ''
  } catch { return '' }
}

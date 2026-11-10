// Stile MapLibre condiviso (Home, selettore luogo, mappe di dettaglio).
// Sfondi senza chiave API: immagini satellitari Esri World Imagery oppure
// mappa CARTO (scura/chiara). La preferenza è salvata in localStorage.
export const SAT_ATTR = 'Immagini © Esri, Maxar, Earthstar Geographics'
export const MAP_ATTR = '© OpenStreetMap, © CARTO'

export function readBasemap() {
  try { return localStorage.getItem('fishlog_basemap') === 'map' ? 'map' : 'sat' } catch { return 'sat' }
}

export function buildStyle({ basemap = 'sat', dark = true, globe = false } = {}) {
  const sat = basemap === 'sat'
  const tiles = sat
    ? ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']
    : ['a', 'b', 'c', 'd'].map(sub => `https://${sub}.basemaps.cartocdn.com/${dark ? 'dark_all' : 'rastertiles/voyager'}/{z}/{x}/{y}@2x.png`)
  const style = {
    version: 8,
    sources: { base: { type: 'raster', tiles, tileSize: sat ? 256 : 512, maxzoom: sat ? 17 : 18, attribution: sat ? SAT_ATTR : MAP_ATTR } },
    layers: [{ id: 'base', type: 'raster', source: 'base' }]
  }
  if (globe) {
    style.projection = { type: 'globe' }
    style.sky = { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] }
  }
  return style
}

export const COOP_LOCALE = {
  'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + scorri per ingrandire la mappa',
  'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + scorri per ingrandire la mappa',
  'CooperativeGesturesHandler.MobileHelpText': 'Usa due dita per muovere la mappa'
}

export async function loadMapLibre() {
  const [mod] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')])
  return mod.default || mod
}

// Ricerca luoghi e geocoding inverso con Nominatim (OpenStreetMap), senza chiave.
// Uso leggero: la ricerca parte solo dopo una pausa di digitazione.
const NOMINATIM = 'https://nominatim.openstreetmap.org'
export async function searchPlaces(query) {
  const r = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=5&accept-language=it&q=${encodeURIComponent(query)}`)
  if (!r.ok) throw new Error('search failed')
  const rows = await r.json()
  return rows.map(p => ({ name: p.display_name, lat: parseFloat(p.lat), lng: parseFloat(p.lon) }))
}
export async function reversePlace(lat, lng) {
  const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&accept-language=it&lat=${lat}&lon=${lng}`)
  if (!r.ok) return ''
  const j = await r.json()
  return j.display_name || ''
}

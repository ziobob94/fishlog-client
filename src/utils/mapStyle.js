// Stile MapLibre condiviso (Home, selettore luogo, mappe di dettaglio).
//
// Provider configurabili da variabili d'ambiente del client (vedi .env.example):
//   VITE_MAPTILER_KEY        chiave MapTiler → satellite "hybrid" + mappe chiara/scura
//   VITE_MAP_STYLE_SAT       URL di stile completo per il satellite (qualsiasi provider MapLibre)
//   VITE_MAP_STYLE_LIGHT     URL di stile completo per la mappa chiara
//   VITE_MAP_STYLE_DARK      URL di stile completo per la mappa scura
// Senza nulla di tutto ciò: OpenFreeMap (mappa, senza chiave) ed Esri World
// Imagery (satellite, senza chiave, solo come ripiego).
const ENV = import.meta.env
const MAPTILER_KEY = (ENV.VITE_MAPTILER_KEY || '').trim()
let keyFailed = false

export const hasMapKey = () => !!MAPTILER_KEY && !keyFailed
// Se il provider risponde 401/403 (chiave errata o limitata) si passa ai ripieghi.
export function markKeyFailed() { keyFailed = true }

export function readBasemap() {
  try { return localStorage.getItem('fishlog_basemap') === 'map' ? 'map' : 'sat' } catch { return 'sat' }
}

const mt = (id) => `https://api.maptiler.com/maps/${id}/style.json?key=${MAPTILER_KEY}`
const ESRI_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
// Etichette (città, regioni, stati) sopra le immagini satellitari: stesso provider, nessuna chiave.
const ESRI_LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
const ESRI_ATTR = 'Immagini ed etichette © Esri, Maxar, Earthstar Geographics, HERE, Garmin'

export function attributionText(basemap) {
  if (basemap === 'sat' && !ENV.VITE_MAP_STYLE_SAT && !hasMapKey()) return ESRI_ATTR
  if (hasMapKey() && !ENV.VITE_MAP_STYLE_SAT && !ENV.VITE_MAP_STYLE_LIGHT) return '© MapTiler © OpenStreetMap contributors'
  if (basemap === 'map' && !hasMapKey() && !ENV.VITE_MAP_STYLE_LIGHT) return '© OpenFreeMap © OpenMapTiles Dati © OpenStreetMap'
  return ''
}

// Restituisce un URL di stile oppure un oggetto stile (per il ripiego raster).
export function buildStyle({ basemap = 'sat', dark = true } = {}) {
  if (basemap === 'sat') {
    if (ENV.VITE_MAP_STYLE_SAT) return ENV.VITE_MAP_STYLE_SAT
    if (hasMapKey()) return mt('hybrid')
    return {
      version: 8,
      sources: {
        base: { type: 'raster', tiles: [ESRI_TILES], tileSize: 256, maxzoom: 17, attribution: ESRI_ATTR },
        labels: { type: 'raster', tiles: [ESRI_LABELS], tileSize: 256, minzoom: 0, maxzoom: 17 }
      },
      layers: [
        { id: 'base', type: 'raster', source: 'base' },
        { id: 'labels', type: 'raster', source: 'labels' }
      ]
    }
  }
  const custom = dark ? ENV.VITE_MAP_STYLE_DARK : ENV.VITE_MAP_STYLE_LIGHT
  if (custom) return custom
  if (hasMapKey()) return mt(dark ? 'streets-v2-dark' : 'streets-v2')
  return 'https://tiles.openfreemap.org/styles/liberty'
}

// Globo + atmosfera: si applicano a ogni caricamento di stile, così funzionano
// con qualsiasi provider (anche con stili che non dichiarano la proiezione).
export function applyGlobe(map) {
  const apply = () => {
    try {
      map.setProjection({ type: 'globe' })
      map.setSky({ 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] })
    } catch { /* versioni senza globo: resta la proiezione piana */ }
  }
  map.on('style.load', apply)
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
  const r = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=5&accept-language=it,en&q=${encodeURIComponent(query)}`)
  if (!r.ok) throw new Error('search failed')
  const rows = await r.json()
  return rows.map(p => ({ name: p.display_name, lat: parseFloat(p.lat), lng: parseFloat(p.lon) }))
}
export async function reversePlace(lat, lng) {
  const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&accept-language=it,en&lat=${lat}&lon=${lng}`)
  if (!r.ok) return ''
  const j = await r.json()
  return j.display_name || ''
}

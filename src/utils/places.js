// Adapter unico per luoghi e mappe: Google Places (suggerimenti + dettagli), Geocoding
// (testo → coordinate, coordinate → nome/regione/provincia/comune/paese) e Maps JavaScript.
// Tutti i form passano di qui: per cambiare provider basta cambiare questo file.
// Chiave: VITE_GOOGLE_MAPS_KEY (mai nel repo). Abilitare nella Google Cloud Console:
// Maps JavaScript API, Places API (New), Geocoding API + fatturazione; restringere la chiave
// per referrer HTTP e per queste tre API.
import { reactive } from 'vue'

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
export const GEO_LANG = 'it'

// error: '' | 'missing' (chiave assente) | 'rejected' (chiave rifiutata/API non abilitata) | 'load' (rete)
export const placesStatus = reactive({ error: '' })
export const hasGoogleKey = () => !!KEY

let loading = null
export function loadGoogle() {
  if (!KEY) { placesStatus.error = 'missing'; return Promise.reject(new Error('missing-key')) }
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google)
  if (loading) return loading
  window.gm_authFailure = () => { placesStatus.error = 'rejected' }
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&language=${GEO_LANG}&loading=async&libraries=places`
    s.async = true
    s.onload = () => resolve(window.google)
    s.onerror = () => { loading = null; placesStatus.error = 'load'; reject(new Error('load-failed')) }
    document.head.appendChild(s)
  })
  return loading
}

async function lib(name) {
  const g = await loadGoogle()
  return g.maps.importLibrary(name)
}
function flagError(e) {
  const m = String(e?.message || e?.code || e)
  if (/denied|not authorized|not enabled|ApiNotActivated|REQUEST_DENIED|InvalidKey|RefererNotAllowed/i.test(m)) placesStatus.error = 'rejected'
}

// ── Componenti d'indirizzo → struttura piatta ─────────────────────────────────
function comp(list, type) {
  const c = (list || []).find(x => (x.types || []).includes(type))
  return c ? (c.longText ?? c.long_name ?? '') : ''
}
export function fromComponents(list, extra = {}) {
  const city = comp(list, 'locality') || comp(list, 'postal_town') || comp(list, 'administrative_area_level_3') || comp(list, 'sublocality') || ''
  const place = {
    name: city,
    city,
    province: comp(list, 'administrative_area_level_2'),
    region: comp(list, 'administrative_area_level_1'),
    country: comp(list, 'country'),
    postalCode: comp(list, 'postal_code'),
    lat: null, lng: null,
    ...extra
  }
  if (!place.name) place.name = place.province || place.region || place.country
  return place
}
const round = n => parseFloat(Number(n).toFixed(6))

// ── Suggerimenti (Places Autocomplete con session token) ─────────────────────
let token = null
async function sessionToken() {
  const { AutocompleteSessionToken } = await lib('places')
  return token || (token = new AutocompleteSessionToken())
}

export async function searchPlaceOptions(q, { kind = 'place' } = {}) {
  const types = kind === 'city' ? ['(cities)'] : kind === 'region' ? ['(regions)'] : null
  try {
    const { AutocompleteSuggestion } = await lib('places')
    const req = { input: q, sessionToken: await sessionToken(), language: GEO_LANG }
    if (types) req.includedPrimaryTypes = types
    let res
    try { res = await AutocompleteSuggestion.fetchAutocompleteSuggestions(req) }
    catch (e) { if (!types) throw e; delete req.includedPrimaryTypes; res = await AutocompleteSuggestion.fetchAutocompleteSuggestions(req) }
    return (res.suggestions || []).filter(s => s.placePrediction).slice(0, 6).map(s => {
      const p = s.placePrediction
      return { title: p.mainText?.text || p.text?.text || '', sub: p.secondaryText?.text || '', prediction: p }
    })
  } catch (e) { flagError(e); return [] }
}

// Dettagli del suggerimento scelto (chiude la sessione di fatturazione) → luogo completo.
export async function resolveOption(o) {
  try {
    const place = o.prediction.toPlace()
    await place.fetchFields({ fields: ['displayName', 'location', 'addressComponents'] })
    token = null
    const p = fromComponents(place.addressComponents, { lat: round(place.location.lat()), lng: round(place.location.lng()) })
    p.name = place.displayName || p.name
    return p
  } catch (e) { flagError(e); return null }
}

// ── Geocoding ─────────────────────────────────────────────────────────────────
async function geocode(req) {
  const { Geocoder } = await lib('geocoding')
  try {
    const { results } = await new Geocoder().geocode({ ...req, language: GEO_LANG })
    return results?.[0] || null
  } catch (e) { flagError(e); return null }
}
// coordinate → nome, regione, provincia, comune, paese (tutti calcolati insieme, quindi coerenti)
export async function reverseGeocode(lat, lng) {
  try {
    const r = await geocode({ location: { lat, lng } })
    return r ? fromComponents(r.address_components, { lat: round(lat), lng: round(lng) }) : null
  } catch (e) { flagError(e); return null }
}
// testo → coordinate e campi derivati
export async function geocodeText(text) {
  try {
    const r = await geocode({ address: text })
    if (!r) return null
    const loc = r.geometry.location
    return fromComponents(r.address_components, { lat: round(loc.lat()), lng: round(loc.lng()) })
  } catch (e) { flagError(e); return null }
}
// compatibilità: nome breve per un punto
export async function reverseLabel(lat, lng) { return (await reverseGeocode(lat, lng))?.name || '' }

// ── Mappa ─────────────────────────────────────────────────────────────────────
export async function loadMap() { return (await lib('maps')) }

// Chiave i18n dell'avviso da mostrare quando Google non è utilizzabile ('' se tutto ok).
// Nessun ripiego silenzioso su altri provider: la chiave mancante o rifiutata va resa visibile.
export const placesErrorKey = () => (!KEY || placesStatus.error === 'missing') ? 'placeInput.keyMissing'
  : ({ rejected: 'placeInput.keyRejected', load: 'placeInput.loadFailed' }[placesStatus.error] || '')

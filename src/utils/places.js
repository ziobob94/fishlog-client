// Adapter unico per luoghi e mappe: Google Places (suggerimenti + dettagli), Geocoding
// (testo → coordinate, coordinate → nome/regione/provincia/comune/paese) e Maps JavaScript.
// Tutti i form passano di qui: per cambiare provider basta cambiare questo file.
// Chiave: VITE_GOOGLE_MAPS_KEY (mai nel repo). Abilitare nella Google Cloud Console:
// Maps JavaScript API, Places API (New), Geocoding API + fatturazione; restringere la chiave
// per referrer HTTP e per queste tre API.
import { reactive } from 'vue'

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
export const GEO_LANG = 'it'

// error: '' | 'missing' | 'rejected' (chiave/API/fatturazione/referrer) | 'blocked' (script bloccato da rete, CSP o ad-blocker)
//        | 'timeout' | 'init' (errore imprevisto). code = codice Google (es. RefererNotAllowedMapError), detail = messaggio grezzo.
export const placesStatus = reactive({ error: '', code: '', detail: '' })
export const hasGoogleKey = () => !!KEY

const CODE_RE = /(InvalidKey|MissingKey|ExpiredKey|RefererNotAllowed|ApiNotActivated|BillingNotEnabled|ApiTargetBlocked|OverQuota|RequestDenied|NotLoadedElsewhere|InvalidRequest)\w*/i
function fail(error, detail = '', code = '') {
  if (!placesStatus.error || error === 'rejected') placesStatus.error = error
  if (code) placesStatus.code = code
  if (detail) placesStatus.detail = String(detail).slice(0, 200)
  console.error('[google-maps]', error, code || '', detail || '')
}
// Google scrive il motivo preciso del rifiuto solo in console: lo intercetto per mostrarlo anche in UI.
function watchConsole() {
  const orig = console.error
  console.error = function (...a) {
    try { const m = String(a[0] ?? '').match(/Google Maps JavaScript API (?:error|warning): (\w+)/i) || (/Google Maps/i.test(String(a[0])) && String(a[0]).match(CODE_RE)); if (m) { placesStatus.code = m[1] || m[0]; placesStatus.error = 'rejected' } } catch { /* ignora */ }
    return orig.apply(this, a)
  }
}

let loading = null
export function loadGoogle() {
  if (!KEY) { placesStatus.error = 'missing'; return Promise.reject(new Error('missing-key')) }
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google)
  if (loading) return loading
  window.gm_authFailure = () => fail('rejected', 'gm_authFailure', placesStatus.code)
  watchConsole()
  document.addEventListener('securitypolicyviolation', (e) => { if (/google|gstatic/.test(e.blockedURI || '')) fail('blocked', `CSP: ${e.violatedDirective}`) })
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&language=${GEO_LANG}&loading=async&libraries=places`
    s.async = true
    const timer = setTimeout(() => { loading = null; fail('timeout', 'script non caricato in 15 s'); reject(new Error('timeout')) }, 15000)
    s.onload = () => {
      clearTimeout(timer)
      // script "caricato" ma vuoto (ad-blocker, proxy, CSP): google non esiste
      if (!window.google?.maps?.importLibrary) { loading = null; fail('blocked', 'script caricato ma Google Maps non disponibile'); reject(new Error('blocked')); return }
      resolve(window.google)
    }
    s.onerror = () => { clearTimeout(timer); loading = null; fail('blocked', 'script non raggiungibile (rete, CSP o ad-blocker)'); reject(new Error('blocked')) }
    document.head.appendChild(s)
  })
  return loading
}

// Chiamata da chi cattura un errore di caricamento/inizializzazione: lo registra con il suo messaggio.
export function reportMapError(e) { if (!placesStatus.error) fail('init', e?.message || e); else console.error('[google-maps]', e) }

// Testo per l'utente: motivo breve + cosa fare (+ codice Google tra parentesi per la diagnosi).
export function placesMessage(t) {
  const c = placesStatus.code || ''
  const tail = c ? ` (${c})` : (placesStatus.detail ? ` (${placesStatus.detail})` : '')
  if (!KEY || placesStatus.error === 'missing') return t('placeInput.keyMissing')
  switch (placesStatus.error) {
    case 'rejected': {
      if (/Referer/i.test(c)) return t('placeInput.errReferer', { origin: location.origin }) + tail
      if (/ApiNotActivated|ApiTarget/i.test(c)) return t('placeInput.errApi') + tail
      if (/Billing|OverQuota/i.test(c)) return t('placeInput.errBilling') + tail
      if (/Invalid|Missing|Expired/i.test(c)) return t('placeInput.errInvalid') + tail
      return t('placeInput.keyRejected') + tail
    }
    case 'blocked': return t('placeInput.errBlocked') + tail
    case 'timeout': return t('placeInput.errTimeout')
    case 'init': return t('placeInput.errInit') + tail
    default: return ''
  }
}
// debug da console: window.fishlogMapsDebug()
if (typeof window !== 'undefined') window.fishlogMapsDebug = () => ({ keyPresent: !!KEY, keyPrefix: KEY ? KEY.slice(0, 6) + '…' : '', origin: location.origin, status: { ...placesStatus }, googleLoaded: !!window.google?.maps, scriptTags: document.querySelectorAll('script[src*="maps.googleapis.com"]').length })

async function lib(name) {
  const g = await loadGoogle()
  return g.maps.importLibrary(name)
}
function flagError(e) {
  const m = String(e?.message || e?.code || e)
  if (/denied|not authorized|not enabled|ApiNotActivated|REQUEST_DENIED|InvalidKey|RefererNotAllowed/i.test(m)) fail('rejected', m, m.match(CODE_RE)?.[0] || '')
  else console.error('[google-maps]', e)
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

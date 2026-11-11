<template>
  <!-- Il segnaposto mantiene l'altezza del compatto quando il mappamondo diventa a tutto schermo (mobile): nessun layout shift. -->
  <div class="globe-wrap" :class="{ 'is-holding': isDialog }">
    <section
      ref="card"
      class="globe-card"
      :class="{ 'is-expanded': expanded, 'is-dialog': isDialog, 'is-compact': !expanded }"
      :role="isDialog ? 'dialog' : undefined"
      :aria-modal="isDialog ? 'true' : undefined"
      :aria-labelledby="isDialog ? titleId : undefined"
      :aria-label="isDialog ? undefined : (expanded ? t('home.globe.expandedAria') : t('home.globe.compactAria'))"
      @keydown="onKeydown"
    >
      <!-- Mobile espanso: intestazione con maniglia, titolo e «Riduci» -->
      <template v-if="isDialog">
        <div class="globe-handle" aria-hidden="true" :title="t('home.globe.handle')" v-bind="swipe.handlers"><i></i></div>
        <div class="globe-head globe-fade">
          <h2 :id="titleId" class="globe-title">{{ t('home.globe.title') }}</h2>
          <button ref="collapseBtn" type="button" class="globe-pill-btn m-press" @click="setExpanded(false)">
            <Minimize2 :size="18" aria-hidden="true" /> {{ t('home.globe.collapse') }}
          </button>
        </div>
        <div class="globe-zones globe-fade" role="group" :aria-label="t('home.globe.zones')">
          <button v-for="z in zones" :key="z.key" type="button" class="fl-chip" :class="{ on: zone === z.key }" :aria-pressed="zone === z.key" @click="pickZone(z)">
            {{ t(`home.zones.items.${z.key}`) }}
          </button>
        </div>
      </template>

      <div :id="stageId" ref="stage" class="globe-stage">
        <div ref="mapEl" class="globe-map" role="region" :aria-label="ariaLabel" :aria-hidden="expanded ? undefined : 'true'"></div>
        <!-- Mappa non caricata: chiave/referrer rifiutati, rete assente o tessere che non arrivano -->
        <div v-if="mapError" class="globe-state" role="alert">
          <Globe :size="28" aria-hidden="true" />
          <strong>{{ t('home.globe.mapNotLoaded') }}</strong>
          <span class="globe-state-text">{{ mapError }}</span>
          <button type="button" class="globe-pill-btn m-press" @click="retryMap"><RefreshCw :size="18" aria-hidden="true" /> {{ t('home.globe.locRetry') }}</button>
        </div>

        <!-- Posizione non attiva: permesso negato o posizione non disponibile -->
        <div v-if="geoState === 'denied' || geoState === 'unavailable'" class="globe-loc" role="alert">
          <button type="button" class="globe-popup-close" :aria-label="t('common.close')" @click="geoState = ''"><AppIcon name="chiudi" :size="18" /></button>
          <strong class="globe-loc-title"><MapPinOff :size="18" aria-hidden="true" /> {{ t('home.globe.noPosition') }}</strong>
          <p>{{ geoState === 'denied' ? t('home.globe.locDeniedText') : t('home.globe.locUnavailableText') }}</p>
          <ol v-if="geoState === 'denied'" class="globe-loc-steps">
            <li v-for="n in 3" :key="n">{{ t(`weather.help.${platform}.s${n}`) }}</li>
          </ol>
          <div class="globe-loc-actions">
            <button v-if="geoState === 'unavailable'" type="button" class="globe-pill-btn m-press" @click="activateLocation">{{ t('home.globe.locRetry') }}</button>
            <RouterLink :to="{ path: '/meteo', query: { modo: 'cerca' } }" class="globe-pill-btn m-press globe-loc-link"><Search :size="18" aria-hidden="true" /> {{ t('home.globe.pickPlace') }}</RouterLink>
          </div>
        </div>

        <!-- Compatto e desktop espanso: etichette in alto a sinistra e tasto Espandi / Riduci -->
        <template v-if="!isDialog">
          <div class="globe-pills">
            <span v-if="meActive" class="globe-pill globe-pill-me"><AppIcon name="luogo" :size="14" /> {{ t('home.globe.here') }}</span>
            <button v-else type="button" class="globe-pill globe-pill-me globe-pill-act m-press" :disabled="geoState === 'asking'" @click="activateLocation">
              <AppIcon name="luogo" :size="14" /> {{ geoState === 'asking' ? t('home.globe.locating') : t('home.globe.activate') }}
            </button>
            <span class="globe-pill globe-pill-spot">{{ t('home.globe.spots', { n: spots.length }, spots.length) }}</span>
          </div>
          <button ref="expandBtn" type="button" class="globe-expand m-press" :aria-expanded="expanded ? 'true' : 'false'" :aria-controls="stageId" @click="setExpanded(!expanded)">
            <component :is="expanded ? Minimize2 : Maximize2" :size="18" aria-hidden="true" />
            {{ expanded ? t('home.globe.collapse') : t('home.globe.expand') }}
          </button>
        </template>

        <!-- Controlli (solo espanso) -->
        <div v-if="expanded" class="globe-toolbar globe-fade">
          <button type="button" class="globe-btn" :aria-label="t('globe.zoomIn')" @click="zoomBy(1.3)"><AppIcon name="nuova-uscita" :size="20" /></button>
          <button type="button" class="globe-btn" :aria-label="t('globe.zoomOut')" @click="zoomBy(1 / 1.3)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
          </button>
          <button type="button" class="globe-btn" :aria-label="t('globe.myPosition')" :title="t('globe.myPosition')" @click="activateLocation"><AppIcon name="luogo" :size="20" /></button>
          <button type="button" class="globe-btn" :aria-label="t('globe.layer')" :title="t('globe.layer')" :aria-pressed="basemap === 'sat'" @click="toggleBasemap"><Layers :size="20" /></button>
          <button type="button" class="globe-btn" :aria-label="t('globe.showCatches')" :title="t('globe.showCatches')" :disabled="!spots.length" @click="showAll"><AppIcon name="uscite" :size="20" /></button>
        </div>

        <!-- Scheda del segnaposto toccato -->
        <div v-if="selected" class="globe-popup" role="dialog" :aria-label="t('globe.sessionsHere')">
          <button type="button" class="globe-popup-close" :aria-label="t('common.close')" @click="selected = null"><AppIcon name="chiudi" :size="18" /></button>
          <ul class="globe-popup-list">
            <li v-for="s in selected.items" :key="s._id">
              <RouterLink :to="`/session/${s._id}`" class="globe-popup-item">
                <strong>{{ s.title || s.location?.name || t('session.untitled') }}</strong>
                <span class="text-muted text-xs">{{ fmtDate(s.date) }} · {{ t('globe.catches', { n: s.totalCatches || 0 }, s.totalCatches || 0) }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Solo espanso: legenda, alternativa testuale al globo e (mobile) striscia meteo -->
      <div v-if="expanded" class="globe-below globe-fade">
        <div class="globe-legend">
          <span class="legend-item"><i class="dot dot-me"></i> {{ t('globe.you') }}</span>
          <span class="legend-item"><i class="dot dot-spot"></i> {{ t('globe.catchesLegend') }}</span>
          <span class="legend-hint">{{ t('globe.dragHint') }}</span>
        </div>
        <details v-if="spots.length" class="globe-list">
          <summary>{{ t('globe.listToggle') }}</summary>
          <ul>
            <li v-for="s in spots" :key="s._id">
              <RouterLink :to="`/session/${s._id}`">{{ s.title || s.location?.name || t('session.untitled') }}</RouterLink>
              <span class="text-muted text-xs"> · {{ fmtDate(s.date) }}</span>
            </li>
          </ul>
        </details>
        <p v-else-if="!loading" class="text-muted text-sm">{{ t('globe.empty') }}</p>
        <HomeWeatherStrip v-if="isDialog" class="globe-strip" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Layers, Maximize2, Minimize2, MapPinOff, Globe, RefreshCw, Search } from 'lucide-vue-next'
import api from '../utils/api.js'
import AppIcon from './AppIcon.vue'
import HomeWeatherStrip from './weather/HomeWeatherStrip.vue'
import { useWeatherStore } from '../stores/weather.js'
import { useMediaQuery } from '../composables/useMediaQuery.js'
import { openWithTransition } from './motion/useViewTransition.js'
import { useSwipeDismiss } from './motion/motion.js'
import { loadMap, placesStatus, placesMessage, reportMapError, resetPlaces } from '../utils/places.js'

const { t } = useI18n()

// Il mappamondo parte compatto (196 px, 220 su desktop) a ogni apertura della Home e fermo, per risparmiare batteria.
// Da mobile si espande in un dialog a tutto schermo; da desktop in una regione da 700 px (il meteo diventa una barra sopra:
// lo gestisce la Home tramite `expanded`).
// Mappa Google Maps JS (satellite con etichette / stradale), caricata solo qui; vedi utils/places.js.

const expanded = defineModel('expanded', { type: Boolean, default: false })
const isDesktop = useMediaQuery('(min-width: 768px)')
const isDialog = computed(() => expanded.value && !isDesktop.value)
const uid = Math.random().toString(36).slice(2, 8)
const titleId = `globe-t-${uid}`, stageId = `globe-s-${uid}`

const weather = useWeatherStore()
const card = ref(null)
const expandBtn = ref(null)
const collapseBtn = ref(null)
const zone = ref('here')

// Zone di mare (centro e zoom); «La mia posizione» usa il GPS e chiede il permesso solo al tocco.
const zones = [
  { key: 'here' },
  { key: 'adriatic', center: { lat: 43.6, lng: 14.6 }, zoom: 6 },
  { key: 'tyrrhenian', center: { lat: 40.0, lng: 12.0 }, zoom: 6 },
  { key: 'ligurian', center: { lat: 43.7, lng: 8.9 }, zoom: 7 },
  { key: 'ionian', center: { lat: 38.0, lng: 18.0 }, zoom: 6 }
]

const spots = ref([])
const loading = ref(true)
const selected = ref(null)
const me = ref(null)
// '' | 'asking' | 'denied' | 'unavailable'. Il permesso si chiede solo da activateLocation(), cioè da un tocco.
const geoState = ref('')
const platform = (() => {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  return /Android/i.test(ua) ? 'android' : 'desktop'
})()
const mapError = ref('')
const reduceMotion = ref(false)
const mapEl = ref(null)
const stage = ref(null)
const basemap = ref(readBasemap())
const gmErr = computed(() => placesStatus.error)
const meActive = computed(() => !!me.value || weather.place?.mode === 'here')

function readBasemap() {
  try { return localStorage.getItem('fishlog_basemap') === 'map' ? 'map' : 'sat' } catch { return 'sat' }
}

const ariaLabel = computed(() => t('globe.aria', { n: spots.value.length }, spots.value.length))
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
const markerLabel = m => m.items.length > 1
  ? t('globe.clusterLabel', { n: m.items.length })
  : (m.items[0].title || m.items[0].location?.name || t('session.untitled'))

let map = null
let meMarker = null
let spotMarkers = []
let lastCenter = null
let resizeObs = null
let tilesTimer = null

const cssRgb = (v, fb) => { try { const x = getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return x ? `rgb(${x.split(/[ ,]+/).join(',')})` : fb } catch { return fb } }
const svgUrl = (svg) => 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
function pinIcon(count) {
  const r = count > 1 ? 15 : 11, w = r * 2 + 6
  const fill = cssRgb('--color-sand', '#f59e0b'), stroke = cssRgb('--color-ink', '#0b1b2b'), txt = cssRgb('--color-on-primary', '#0b1b2b')
  const label = count > 1 ? `<text x="${w / 2}" y="${w / 2 + 4.5}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="13" fill="${txt}">${count}</text>` : ''
  return { url: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}"><circle cx="${w / 2}" cy="${w / 2}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>${label}</svg>`), size: w }
}
function meIcon() {
  const fill = cssRgb('--color-ocean', '#0ea5e9')
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="12" fill="${fill}" fill-opacity=".28"/><circle cx="13" cy="13" r="8" fill="${fill}" stroke="#fff" stroke-width="3"/></svg>`)
}

// Raggruppa i segnaposto vicini nello spazio schermo e ricrea i marker.
function refreshMarkers() {
  const g = window.google?.maps
  if (!map || !g || !map.getProjection()) return
  spotMarkers.forEach(m => m.setMap(null))
  spotMarkers = []
  const scale = 2 ** map.getZoom()
  const proj = map.getProjection()
  const groups = []
  for (const s of spots.value) {
    const { lng, lat } = s.location.coords
    const pt = proj.fromLatLngToPoint(new g.LatLng(lat, lng))
    const x = pt.x * scale, y = pt.y * scale
    const near = groups.find(q => Math.hypot(q.x - x, q.y - y) < 24)
    if (near) near.items.push(s)
    else groups.push({ x, y, lng, lat, items: [s] })
  }
  for (const q of groups) {
    const ic = pinIcon(q.items.length)
    const m = new g.Marker({ position: { lat: q.lat, lng: q.lng }, map, title: markerLabel(q), icon: { url: ic.url, scaledSize: new g.Size(ic.size, ic.size), anchor: new g.Point(ic.size / 2, ic.size / 2) } })
    m.addListener('click', () => { selected.value = q })
    spotMarkers.push(m)
  }
}

function setMeMarker() {
  const g = window.google?.maps
  if (!map || !g || !me.value) return
  meMarker?.setMap(null)
  meMarker = new g.Marker({ position: me.value, map, zIndex: 1000, clickable: false, icon: { url: meIcon(), scaledSize: new g.Size(26, 26), anchor: new g.Point(13, 13) } })
}

function fly(center, zoom) {
  if (!map) return
  map.panTo(center)
  if (zoom && map.getZoom() < zoom) map.setZoom(zoom)
}

function zoomBy(f) { map?.setZoom(map.getZoom() + (f > 1 ? 1 : -1)) }

function showAll() {
  const g = window.google?.maps
  if (!map || !g || !spots.value.length) return
  const bounds = new g.LatLngBounds()
  spots.value.forEach(s => bounds.extend({ lat: s.location.coords.lat, lng: s.location.coords.lng }))
  map.fitBounds(bounds, expanded.value ? 60 : 24)
  g.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > 8) map.setZoom(8) })
}

// Tocco su «Attiva la posizione» / «Vai alla mia posizione». Con il permesso già negato non si richiama il browser
// (iOS e Chrome non ripropongono la richiesta): si mostrano subito i passaggi per riattivarlo.
async function activateLocation() {
  if (geoState.value === 'asking') return
  zone.value = 'here'
  selected.value = null
  if (me.value) { geoState.value = ''; fly(me.value, 8); return }
  if (!navigator.geolocation) { geoState.value = 'unavailable'; return }
  try {
    const p = await navigator.permissions?.query({ name: 'geolocation' })
    if (p?.state === 'denied') { geoState.value = 'denied'; return }
  } catch { /* Permissions API assente (Safari più vecchi): si chiede direttamente */ }
  geoState.value = 'asking'
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoState.value = ''
      me.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setMeMarker()
      fly(me.value, 8)
      // La Home mostra il meteo di questo luogo.
      if (!weather.place) { weather.setPlace({ name: '', lat: me.value.lat, lng: me.value.lng, mode: 'here' }); weather.load().catch(() => {}) }
    },
    (err) => { geoState.value = err?.code === 1 ? 'denied' : 'unavailable' },
    { timeout: 15000, maximumAge: 60000 }
  )
}

function pickZone(z) {
  if (z.key === 'here') { activateLocation(); return }
  zone.value = z.key
  geoState.value = ''
  if (map) { map.panTo(z.center); map.setZoom(z.zoom) }
}

const mapType = () => (basemap.value === 'sat' ? 'hybrid' : 'roadmap')
function toggleBasemap() {
  basemap.value = basemap.value === 'sat' ? 'map' : 'sat'
  try { localStorage.setItem('fishlog_basemap', basemap.value) } catch { /* ignora */ }
}
watch(basemap, () => map?.setMapTypeId(mapType()))

// Compatto = fermo (nessun gesto, la pagina scorre); espanso = interattivo (a tutto schermo: un dito basta, altrimenti due dita).
const gesture = () => (!expanded.value ? 'none' : isDialog.value ? 'greedy' : 'cooperative')
// Dopo ogni cambio di dimensione il contenitore ha misure nuove: senza resize + setCenter la mappa resta grigia o fuori centro.
function resizeMap() {
  const g = window.google?.maps
  if (!map || !g) return
  const c = lastCenter || map.getCenter()
  g.event.trigger(map, 'resize')
  if (c) map.setCenter(c)
}
function applyMapMode() {
  if (!map) return
  map.setOptions({ gestureHandling: gesture(), keyboardShortcuts: false })
  resizeMap()
  if (!expanded.value) selected.value = null
  if (me.value && zone.value === 'here' && expanded.value) fly(me.value, 8)
  else if (spots.value.length) showAll()
  refreshMarkers()
}

async function initMap() {
  try {
    const { Map } = await loadMap()
    map = new Map(mapEl.value, {
      center: { lat: 42, lng: 12.5 }, zoom: 4, mapTypeId: mapType(),
      disableDefaultUI: true, clickableIcons: false, keyboardShortcuts: false,
      gestureHandling: gesture(), tilt: 0, rotateControl: false
    })
    map.addListener('idle', () => { lastCenter = map.getCenter(); refreshMarkers() })
    // Se le tessere non arrivano entro 12 s (grigio) si mostra lo stato «Mappa non caricata» con «Riprova».
    clearTimeout(tilesTimer)
    tilesTimer = setTimeout(() => { if (!mapError.value) mapError.value = t('home.globe.mapNotLoadedText') }, 12000)
    window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => { clearTimeout(tilesTimer); mapError.value = ''; refreshMarkers(); setMeMarker(); showAll() })
    resizeObs?.disconnect()
    if (typeof ResizeObserver !== 'undefined') { resizeObs = new ResizeObserver(() => resizeMap()); resizeObs.observe(mapEl.value) }
  } catch (e) {
    reportMapError(e)
    clearTimeout(tilesTimer)
    mapError.value = placesMessage(t) || t('home.globe.mapNotLoadedText')
  }
}
function retryMap() { resetPlaces(); mapError.value = ''; clearTimeout(tilesTimer); resizeObs?.disconnect(); map = null; lastCenter = null; initMap() }
watch(() => [placesStatus.error, placesStatus.code], () => { if (placesStatus.error) mapError.value = placesMessage(t) })

// ── Espandi / Riduci ──────────────────────────────────────────────────────────
// Espansione 320 ms (--ease-enter) con View Transition sull'elemento `globe`, riduzione 200 ms (--ease-exit); senza l'API
// o con movimento ridotto si cambia stato subito e le parti nuove compaiono in dissolvenza (≤ 120 ms).
async function setExpanded(open, { animate = true } = {}) {
  if (open === expanded.value) return
  const root = document.documentElement
  const update = async () => {
    expanded.value = open
    await nextTick()
    applyMapMode()
  }
  root.classList.toggle('globe-closing', !open)
  if (animate) await openWithTransition(update); else await update()
  root.classList.remove('globe-closing')
  await nextTick()
  if (open) (collapseBtn.value || expandBtn.value)?.focus()
  else expandBtn.value?.focus() // il focus torna sul tasto Espandi
}

// Swipe verso il basso sulla maniglia (mobile): chiude senza ripetere l'animazione.
const swipe = useSwipeDismiss(card, {
  onDismiss: () => {
    setExpanded(false, { animate: false })
    if (card.value) { card.value.style.transform = ''; card.value.style.transition = '' }
  }
})

// Focus trap nel dialog e Esc per chiudere (anche nella regione da 700 px del desktop).
function onKeydown(e) {
  if (!expanded.value) return
  if (e.key === 'Escape') { e.stopPropagation(); setExpanded(false); return }
  if (e.key !== 'Tab' || !isDialog.value || !card.value) return
  const items = [...card.value.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')]
    .filter(el => el.offsetParent !== null || el === document.activeElement)
  if (!items.length) return
  const first = items[0], last = items[items.length - 1]
  if (e.shiftKey && (document.activeElement === first || !card.value.contains(document.activeElement))) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && (document.activeElement === last || !card.value.contains(document.activeElement))) { e.preventDefault(); first.focus() }
}

// Con il dialog aperto la pagina sotto non scorre.
let prevOverflow = ''
watch(isDialog, (on) => {
  if (on) { prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
  else document.body.style.overflow = prevOverflow
})
// Cambio di larghezza con il globo aperto (rotazione dello schermo): la mappa ricalcola le dimensioni.
watch(isDesktop, () => nextTick(applyMapMode))

onMounted(async () => {
  const forced = document.documentElement.getAttribute('data-motion')
  reduceMotion.value = forced === 'reduce' ? true : forced === 'full' ? false : !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!import.meta.env.VITE_GOOGLE_MAPS_KEY) mapError.value = t('placeInput.keyMissing')
  initMap()
  try {
    const { data } = await api.get('/sessions', { params: { mine: true, limit: 200 } })
    spots.value = (data.data || []).filter(s =>
      typeof s.location?.coords?.lat === 'number' && typeof s.location?.coords?.lng === 'number')
    refreshMarkers()
    if (spots.value.length) showAll()
  } catch { /* la mappa resta senza segnaposto */ }
  finally { loading.value = false }
})
onBeforeUnmount(() => {
  if (isDialog.value) document.body.style.overflow = prevOverflow
  document.documentElement.classList.remove('globe-closing')
  clearTimeout(tilesTimer); resizeObs?.disconnect()
  spotMarkers.forEach(m => m.setMap(null)); meMarker?.setMap(null); map = null
})
</script>

<style scoped>
.globe-wrap { @apply mb-4; }
/* Segnaposto: tiene il posto del compatto mentre il mappamondo è un overlay a tutto schermo. */
.globe-wrap.is-holding { height: 196px; }

.globe-card {
  @apply relative bg-surface border border-border/60 overflow-hidden;
  border-radius: 24px 24px 24px 8px; view-transition-name: globe;
}
.globe-card.is-compact { height: 196px; }
@media (min-width: 768px) { .globe-card.is-compact { height: 220px; } }

.globe-stage { @apply relative overflow-hidden; background: rgb(var(--color-ink)); }
.is-compact .globe-stage { height: 100%; }
.is-compact .globe-map { pointer-events: none; }   /* il globo compatto è fermo: la pagina scorre anche sopra */
.globe-map { @apply absolute inset-0; }
.globe-state {
  @apply absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-4 text-center text-foam;
  background: rgb(var(--color-ink) / .92);
}
.globe-state-text { @apply text-sm text-muted; max-width: 32ch; }
.globe-pill-act { @apply cursor-pointer min-h-[44px] px-4; }
.globe-pill-act:disabled { @apply opacity-70 cursor-wait; }
.globe-loc { @apply absolute left-3 right-3 bottom-3 z-20 rounded-xl bg-surface border border-border p-4 pr-12 text-sm; max-height: 70%; overflow-y: auto; }
.globe-loc p { @apply m-0 mt-1 text-muted; }
.globe-loc-title { @apply inline-flex items-center gap-2 text-foam; }
.globe-loc-steps { @apply my-2 pl-5 text-foam; }
.globe-loc-actions { @apply flex flex-wrap gap-2 mt-3; }
.globe-loc-link { @apply no-underline; }

/* Desktop espanso: regione da 700 px nell'area principale. */
.globe-card.is-expanded:not(.is-dialog) .globe-stage { height: 700px; }
.globe-card.is-expanded:not(.is-dialog) { border-radius: 24px 24px 24px 8px; }

/* Mobile espanso: a tutto schermo, sopra la barra in alto e quella in basso. Le aree sicure (notch, barra di Home) restano libere
   con il padding; 100dvh evita che la barra degli indirizzi del browser tagli il fondo. */
.globe-card.is-dialog {
  position: fixed; inset: 0; height: 100vh; height: 100dvh; z-index: 120; border-radius: 0; border-width: 0; display: flex; flex-direction: column;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  background: rgb(var(--color-ink)); touch-action: pan-y;
}
.is-dialog .globe-stage { flex: 1; min-height: 0; }
.is-dialog .globe-below { @apply px-3 pb-4 pt-2; display: grid; gap: 8px; }
.is-dialog .globe-legend, .is-dialog .globe-list { display: none; }
.is-dialog .globe-below:has(.globe-strip) { padding-bottom: 20px; }
.globe-handle { @apply flex justify-center pt-2 pb-1; touch-action: none; cursor: grab; }
.globe-handle i { display: block; width: 40px; height: 4px; border-radius: 4px; background: rgb(var(--color-border-light)); }
.globe-head { @apply flex items-center justify-between gap-3 px-4 pb-2; }
.globe-title { font-family: var(--font-display); @apply text-xl font-bold m-0; }
.globe-pill-btn {
  @apply inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-border-light bg-surface-2 text-foam font-bold text-sm cursor-pointer;
}
.globe-zones { @apply flex gap-2 overflow-x-auto px-4 pb-3; scrollbar-width: none; }
.globe-zones::-webkit-scrollbar { display: none; }

.globe-pills { @apply absolute left-3 top-3 flex flex-wrap items-center gap-2; max-width: calc(100% - 130px); }
.globe-pill {
  @apply inline-flex items-center gap-1 rounded-full px-3 text-xs font-bold; min-height: 28px; border: 1px solid transparent;
  backdrop-filter: blur(6px); background: rgb(var(--color-ink) / .72);
}
.globe-pill-me { color: rgb(var(--color-ocean-text)); border-color: rgb(var(--color-ocean-text)); }
.globe-pill-spot { color: rgb(var(--color-sand-text)); border-color: rgb(var(--color-sand-text)); }
.globe-expand {
  @apply absolute right-3 top-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-border-light text-foam font-bold text-sm cursor-pointer;
  background: rgb(var(--color-surface) / .92);
}
.globe-expand:focus-visible, .globe-pill-btn:focus-visible, .globe-btn:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }

/* Controlli a destra del globo (zoom, posizione, strato, pescate). */
.globe-toolbar { @apply absolute right-3 flex flex-col gap-2; top: 12px; }
.globe-card:not(.is-dialog) .globe-toolbar { top: 68px; }
.globe-btn {
  @apply flex items-center justify-center w-11 h-11 rounded-xl border border-border text-foam cursor-pointer;
  background: rgb(var(--color-surface) / .92);
}
.globe-btn:hover { @apply border-ocean; }
.globe-btn:disabled { @apply opacity-40 cursor-not-allowed; }
.globe-btn[aria-pressed="true"] { @apply text-ocean-text border-ocean; }

/* Le parti che compaiono dopo l'espansione entrano in dissolvenza (200 ms; ≤ 120 ms con movimento ridotto). */
.globe-fade { animation: globe-fade var(--motion-base) var(--ease-standard) both; }
@keyframes globe-fade { from { opacity: 0; } to { opacity: 1; } }

.globe-popup { @apply absolute left-2 right-2 bottom-2 z-10 rounded-lg bg-surface border border-border p-3 pr-12; }
.globe-popup-close { @apply absolute right-1 top-1 w-11 h-11 flex items-center justify-center bg-transparent border-none text-muted cursor-pointer; }
.globe-popup-list { @apply list-none flex flex-col gap-1 max-h-40 overflow-y-auto; }
.globe-popup-item { @apply flex flex-col min-h-[44px] justify-center text-foam no-underline; }

.globe-below { @apply p-4 pt-3; }
.globe-legend { @apply flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted; }
.legend-item { @apply inline-flex items-center gap-1.5; }
.legend-hint { @apply ml-auto text-xs; }
.dot { @apply inline-block w-3 h-3 rounded-full; }
.dot-me { @apply bg-ocean; box-shadow: 0 0 0 2px #fff; }
.dot-spot { @apply bg-sand; }

.globe-list { @apply mt-3 text-sm; }
.globe-list summary { @apply cursor-pointer min-h-[44px] flex items-center text-ocean-text font-semibold; }
.globe-list ul { @apply list-none flex flex-col gap-1 pb-1; }
.globe-list li { @apply py-1; }

/* Tema chiaro: chip attivo bianco su ocean = 4,2:1; con ocean-dark ≈ 6:1. */
:root[data-theme='light'] .globe-zones .fl-chip.on { background: rgb(var(--color-ocean-dark)); border-color: rgb(var(--color-ocean-dark)); }
</style>

<style>
/* Transizione del mappamondo (View Transitions): 320 ms in espansione, 200 ms in riduzione. Con movimento ridotto non parte
   (vedi useViewTransition.js) e restano solo le dissolvenze brevi dei token. */
::view-transition-group(globe) { animation-duration: var(--motion-slow); animation-timing-function: var(--ease-enter); }
:root.globe-closing::view-transition-group(globe) { animation-duration: var(--motion-base); animation-timing-function: var(--ease-exit); }
</style>

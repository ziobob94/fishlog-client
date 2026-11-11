<template>
  <section class="globe-card rounded-signature" :aria-label="t('globe.title')">
    <p class="globe-eyebrow">{{ t('globe.eyebrow') }}</p>
    <h2 class="globe-title">{{ t('globe.count', { n: spots.length }, spots.length) }}</h2>

    <div ref="stage" class="globe-stage">
      <div ref="mapEl" class="globe-map" role="region" :aria-label="ariaLabel"></div>
      <div v-if="mapError" class="globe-fallback">{{ mapError }} <button type="button" class="globe-retry" @click="retryMap">{{ t('common.retry') }}</button></div>

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

      <div class="globe-toolbar">
        <button type="button" class="globe-btn" :aria-label="t('globe.zoomIn')" @click="zoomBy(1.3)"><AppIcon name="nuova-uscita" :size="20" /></button>
        <button type="button" class="globe-btn" :aria-label="t('globe.zoomOut')" @click="zoomBy(1 / 1.3)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <button type="button" class="globe-btn" :aria-label="t('globe.myPosition')" :title="t('globe.myPosition')" @click="activateLocation"><AppIcon name="luogo" :size="20" /></button>
        <button type="button" class="globe-btn" :aria-label="t('globe.layer')" :title="t('globe.layer')" :aria-pressed="basemap === 'sat'" @click="toggleBasemap"><Layers :size="20" /></button>
        <button type="button" class="globe-btn" :aria-label="t('globe.showCatches')" :title="t('globe.showCatches')" :disabled="!spots.length" @click="showAll"><AppIcon name="uscite" :size="20" /></button>
      </div>

    <div class="globe-legend">
      <span class="legend-item"><i class="dot dot-me"></i> {{ t('globe.you') }}</span>
      <span class="legend-item"><i class="dot dot-spot"></i> {{ t('globe.catchesLegend') }}</span>
      <span class="legend-hint">{{ t('globe.dragHint') }}</span>
    </div>

    <!-- Alternativa testuale al globo -->
    <details v-if="spots.length" class="globe-list">
      <summary>{{ t('globe.listToggle') }}</summary>
      <ul>
        <li v-for="s in spots" :key="s._id">
          <RouterLink :to="`/session/${s._id}`">{{ s.title || s.location?.name || t('session.untitled') }}</RouterLink>
          <span class="text-muted text-xs"> · {{ fmtDate(s.date) }}</span>
        </li>
      </ul>
    </details>
    <p v-else-if="!loading" class="text-muted text-sm mt-3">{{ t('globe.empty') }}</p>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Layers, MapPinOff, Search } from 'lucide-vue-next'
import api from '../utils/api.js'
import AppIcon from './AppIcon.vue'
import { useWeatherStore } from '../stores/weather.js'
import { loadMap, placesStatus, placesMessage, reportMapError, resetPlaces } from '../utils/places.js'

const { t } = useI18n()
const weather = useWeatherStore()

// Mappa Google Maps JS (satellite con etichette / stradale), caricata solo qui; vedi utils/places.js.

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
  map.fitBounds(bounds, 60)
  g.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > 8) map.setZoom(8) })
}

// Tocco su «Attiva la posizione» / «Vai alla mia posizione». Con il permesso già negato non si richiama il browser
// (iOS e Chrome non ripropongono la richiesta): si mostrano subito i passaggi per riattivarlo.
async function activateLocation() {
  if (geoState.value === 'asking') return
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

const mapType = () => (basemap.value === 'sat' ? 'hybrid' : 'roadmap')
function toggleBasemap() {
  basemap.value = basemap.value === 'sat' ? 'map' : 'sat'
  try { localStorage.setItem('fishlog_basemap', basemap.value) } catch { /* ignora */ }
}
watch(basemap, () => map?.setMapTypeId(mapType()))

async function initMap() {
  try {
    const { Map } = await loadMap()
    map = new Map(mapEl.value, {
      center: { lat: 42, lng: 12.5 }, zoom: 4, mapTypeId: mapType(),
      disableDefaultUI: true, clickableIcons: false, keyboardShortcuts: false,
      gestureHandling: 'cooperative', tilt: 0, rotateControl: false
    })
    map.addListener('idle', refreshMarkers)
    window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => { refreshMarkers(); setMeMarker(); showAll() })
  } catch (e) {
    reportMapError(e)
    mapError.value = placesMessage(t) || t('globe.mapError')
  }
}
function retryMap() { resetPlaces(); mapError.value = ''; map = null; initMap() }
watch(() => [placesStatus.error, placesStatus.code], () => { if (placesStatus.error) mapError.value = placesMessage(t) })

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
onBeforeUnmount(() => { spotMarkers.forEach(m => m.setMap(null)); meMarker?.setMap(null); map = null })
</script>

<style scoped>
.globe-card { @apply bg-surface border border-border/60 p-4 mb-6; }
.globe-eyebrow { @apply text-xs font-bold uppercase text-ocean-text; letter-spacing: 0.14em; }
.globe-title { @apply text-xl mt-1 mb-3; }
.globe-stage { @apply relative rounded-xl overflow-hidden mx-auto; max-width: 560px; height: 380px; background: rgb(var(--color-ink)); }
.globe-map { @apply absolute inset-0; }
.globe-fallback { @apply absolute inset-x-3 bottom-3 rounded-lg bg-surface/95 border border-border p-3 text-sm text-muted; }

.globe-toolbar { @apply flex items-center justify-center gap-2 mt-3; }
.globe-btn {
  @apply flex items-center justify-center w-11 h-11 rounded-xl bg-surface-2 border border-border text-foam cursor-pointer;
}
.globe-btn:hover { @apply border-ocean; }
.globe-btn:disabled { @apply opacity-40 cursor-not-allowed; }
.globe-btn[aria-pressed="true"] { @apply text-ocean-text border-ocean; }

.globe-retry { @apply mt-2 block font-semibold text-ocean-text bg-transparent border-none p-0 cursor-pointer; }
.globe-popup { @apply absolute left-2 right-2 bottom-2 z-10 rounded-lg bg-surface border border-border p-3 pr-12; }
.globe-popup-close { @apply absolute right-1 top-1 w-11 h-11 flex items-center justify-center bg-transparent border-none text-muted cursor-pointer; }
.globe-popup-list { @apply list-none flex flex-col gap-1 max-h-40 overflow-y-auto; }
.globe-popup-item { @apply flex flex-col min-h-[44px] justify-center text-foam no-underline; }

.globe-legend { @apply flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted; }
.legend-item { @apply inline-flex items-center gap-1.5; }
.legend-hint { @apply ml-auto text-xs; }
.dot { @apply inline-block w-3 h-3 rounded-full; }
.dot-me { @apply bg-ocean; box-shadow: 0 0 0 2px #fff; }
.dot-spot { @apply bg-sand; }
.globe-loc { @apply absolute left-3 right-3 bottom-3 z-20 rounded-xl bg-surface border border-border p-4 pr-12 text-sm; max-height: 70%; overflow-y: auto; }
.globe-loc p { @apply m-0 mt-1 text-muted; }
.globe-loc-title { @apply inline-flex items-center gap-2 text-foam; }
.globe-loc-steps { @apply my-2 pl-5 text-foam; }
.globe-loc-actions { @apply flex flex-wrap gap-2 mt-3; }
.globe-loc-link { @apply no-underline; }
.globe-pill-btn {
  @apply inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-border-light bg-surface-2 text-foam font-bold text-sm cursor-pointer;
}
.globe-pill-btn:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }

.globe-list { @apply mt-3 text-sm; }
.globe-list summary { @apply cursor-pointer min-h-[44px] flex items-center text-ocean-text font-semibold; }
.globe-list ul { @apply list-none flex flex-col gap-1 pb-1; }
.globe-list li { @apply py-1; }
</style>

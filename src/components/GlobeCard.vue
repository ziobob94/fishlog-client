<template>
  <section class="globe-card rounded-signature" :aria-label="t('globe.title')">
    <p class="globe-eyebrow">{{ t('globe.eyebrow') }}</p>
    <h2 class="globe-title">{{ t('globe.count', { n: spots.length }, spots.length) }}</h2>

    <div ref="stage" class="globe-stage">
      <div ref="mapEl" class="globe-map" role="region" :aria-label="ariaLabel"></div>
      <div v-if="mapError" class="globe-fallback">{{ mapError }}</div>

      <div class="globe-controls">
        <button type="button" class="globe-btn" :aria-label="t('globe.zoomIn')" @click="zoomBy(1.3)"><AppIcon name="nuova-uscita" :size="20" /></button>
        <button type="button" class="globe-btn" :aria-label="t('globe.zoomOut')" @click="zoomBy(1 / 1.3)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <button type="button" class="globe-btn" :aria-label="t('globe.myPosition')" :title="t('globe.myPosition')" @click="goToMe"><AppIcon name="luogo" :size="20" /></button>
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

    <div class="globe-legend">
      <span class="legend-item"><i class="dot dot-me"></i> {{ t('globe.you') }}</span>
      <span class="legend-item"><i class="dot dot-spot"></i> {{ t('globe.catchesLegend') }}</span>
      <span class="legend-hint">{{ t('globe.dragHint') }}</span>
      <span class="legend-attr">{{ attribution }}</span>
    </div>
    <p v-if="geoError" class="globe-error" role="alert">{{ geoError }}</p>

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
import { Layers } from 'lucide-vue-next'
import api from '../utils/api.js'
import AppIcon from './AppIcon.vue'
import { useThemeStore } from '../stores/theme.js'

const { t } = useI18n()
const theme = useThemeStore()

// Mappa reale con proiezione a globo (MapLibre GL, caricato solo qui).
// Sfondi senza chiave API: immagini satellitari Esri World Imagery e, in
// alternativa, mappa stradale CARTO (scura o chiara secondo il tema).
const SAT_ATTR = 'Immagini © Esri, Maxar, Earthstar Geographics'
const MAP_ATTR = '© OpenStreetMap, © CARTO'

const spots = ref([])
const loading = ref(true)
const selected = ref(null)
const me = ref(null)
const geoError = ref('')
const mapError = ref('')
const reduceMotion = ref(false)
const mapEl = ref(null)
const stage = ref(null)
const basemap = ref(readBasemap())

function readBasemap() {
  try { return localStorage.getItem('fishlog_basemap') === 'map' ? 'map' : 'sat' } catch { return 'sat' }
}

const attribution = computed(() => basemap.value === 'sat' ? SAT_ATTR : MAP_ATTR)
const ariaLabel = computed(() => t('globe.aria', { n: spots.value.length }, spots.value.length))
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
const markerLabel = m => m.items.length > 1
  ? t('globe.clusterLabel', { n: m.items.length })
  : (m.items[0].title || m.items[0].location?.name || t('session.untitled'))

let maplibre = null
let map = null
let meMarker = null
let spotMarkers = []

function buildStyle() {
  const sat = basemap.value === 'sat'
  const dark = theme.mode !== 'light'
  const tiles = sat
    ? ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']
    : ['a', 'b', 'c', 'd'].map(sub => `https://${sub}.basemaps.cartocdn.com/${dark ? 'dark_all' : 'rastertiles/voyager'}/{z}/{x}/{y}@2x.png`)
  return {
    version: 8,
    projection: { type: 'globe' },
    sources: { base: { type: 'raster', tiles, tileSize: sat ? 256 : 512, maxzoom: sat ? 17 : 18, attribution: sat ? SAT_ATTR : MAP_ATTR } },
    layers: [{ id: 'base', type: 'raster', source: 'base' }],
    sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] }
  }
}

function markerEl(count) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'globe-pin' + (count > 1 ? ' globe-pin-cluster' : '')
  el.textContent = count > 1 ? String(count) : ''
  return el
}

// Raggruppa i segnaposto vicini nello spazio schermo e ricrea i marker.
function refreshMarkers() {
  if (!map || !maplibre) return
  spotMarkers.forEach(m => m.remove())
  spotMarkers = []
  const groups = []
  for (const s of spots.value) {
    const { lng, lat } = s.location.coords
    const pt = map.project([lng, lat])
    const near = groups.find(g => Math.hypot(g.x - pt.x, g.y - pt.y) < 24)
    if (near) near.items.push(s)
    else groups.push({ x: pt.x, y: pt.y, lng, lat, items: [s] })
  }
  for (const g of groups) {
    const el = markerEl(g.items.length)
    el.setAttribute('aria-label', markerLabel(g))
    el.addEventListener('click', (e) => { e.stopPropagation(); selected.value = g })
    spotMarkers.push(new maplibre.Marker({ element: el }).setLngLat([g.lng, g.lat]).addTo(map))
  }
}

function setMeMarker() {
  if (!map || !maplibre || !me.value) return
  meMarker?.remove()
  const el = document.createElement('div')
  el.className = 'globe-me'
  el.innerHTML = '<span class="globe-me-pulse"></span><span class="globe-me-dot"></span>'
  meMarker = new maplibre.Marker({ element: el }).setLngLat([me.value.lng, me.value.lat]).addTo(map)
}

function fly(opts) {
  if (!map) return
  map.easeTo({ ...opts, duration: reduceMotion.value ? 0 : 900 })
}

function zoomBy(f) { map?.easeTo({ zoom: map.getZoom() + (f > 1 ? 1 : -1), duration: reduceMotion.value ? 0 : 300 }) }

function showAll() {
  if (!map || !spots.value.length) return
  const bounds = new maplibre.LngLatBounds()
  spots.value.forEach(s => bounds.extend([s.location.coords.lng, s.location.coords.lat]))
  map.fitBounds(bounds, { padding: 60, maxZoom: 6, duration: reduceMotion.value ? 0 : 900 })
}

function goToMe() {
  geoError.value = ''
  if (me.value) { fly({ center: [me.value.lng, me.value.lat], zoom: 6 }); return }
  if (!navigator.geolocation) { geoError.value = t('globe.geoUnavailable'); return }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      me.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setMeMarker()
      fly({ center: [me.value.lng, me.value.lat], zoom: 6 })
    },
    () => { geoError.value = t('globe.geoDenied') },
    { timeout: 8000 }
  )
}

function toggleBasemap() {
  basemap.value = basemap.value === 'sat' ? 'map' : 'sat'
  try { localStorage.setItem('fishlog_basemap', basemap.value) } catch { /* ignora */ }
}

function applyStyle() { map?.setStyle(buildStyle(), { diff: false }) }
watch([basemap, () => theme.mode], applyStyle)

async function initMap() {
  try {
    const [mod] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')])
    maplibre = mod.default || mod
    map = new maplibre.Map({
      container: mapEl.value,
      style: buildStyle(),
      center: [12.5, 42], zoom: 1.6,
      attributionControl: false,
      cooperativeGestures: true,
      pitchWithRotate: false, dragRotate: false, touchPitch: false,
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + scorri per ingrandire la mappa',
        'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + scorri per ingrandire la mappa',
        'CooperativeGesturesHandler.MobileHelpText': 'Usa due dita per muovere la mappa'
      }
    })
    map.touchZoomRotate.disableRotation()
    map.on('moveend', refreshMarkers)
    map.on('error', (e) => { if (e?.error?.status === 403 || e?.error?.status === 401) mapError.value = t('globe.tilesError') })
    map.once('load', () => { refreshMarkers(); setMeMarker(); showAll() })
  } catch {
    mapError.value = t('globe.mapError')
  }
}

onMounted(async () => {
  reduceMotion.value = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
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
onBeforeUnmount(() => { spotMarkers.forEach(m => m.remove()); meMarker?.remove(); map?.remove(); map = null })
</script>

<style scoped>
.globe-card { @apply bg-surface border border-border/60 p-4 mb-6; }
.globe-eyebrow { @apply text-xs font-bold uppercase text-ocean-text; letter-spacing: 0.14em; }
.globe-title { @apply text-xl mt-1 mb-3; }
.globe-stage { @apply relative rounded-xl overflow-hidden mx-auto; max-width: 560px; height: 380px; background: rgb(var(--color-ink)); }
.globe-map { @apply absolute inset-0; }
.globe-fallback { @apply absolute inset-x-3 bottom-3 rounded-lg bg-surface/95 border border-border p-3 text-sm text-muted; }

.globe-controls { @apply absolute right-2 top-2 flex flex-col gap-1.5 z-10; }
.globe-btn {
  @apply flex items-center justify-center w-10 h-10 rounded-xl bg-surface/90 border border-border text-foam cursor-pointer;
}
.globe-btn:hover { @apply border-ocean; }
.globe-btn:disabled { @apply opacity-40 cursor-not-allowed; }
.globe-btn[aria-pressed="true"] { @apply text-ocean-text border-ocean; }

.globe-popup { @apply absolute left-2 right-14 bottom-2 z-10 rounded-lg bg-surface border border-border p-3 pr-12; }
.globe-popup-close { @apply absolute right-1 top-1 w-11 h-11 flex items-center justify-center bg-transparent border-none text-muted cursor-pointer; }
.globe-popup-list { @apply list-none flex flex-col gap-1 max-h-40 overflow-y-auto; }
.globe-popup-item { @apply flex flex-col min-h-[44px] justify-center text-foam no-underline; }

.globe-legend { @apply flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted; }
.legend-item { @apply inline-flex items-center gap-1.5; }
.legend-hint { @apply ml-auto text-xs; }
.legend-attr { @apply basis-full text-[0.65rem] opacity-70; }
.dot { @apply inline-block w-3 h-3 rounded-full; }
.dot-me { @apply bg-ocean; box-shadow: 0 0 0 2px #fff; }
.dot-spot { @apply bg-sand; }
.globe-error { @apply text-danger-text text-sm mt-2; }

.globe-list { @apply mt-3 text-sm; }
.globe-list summary { @apply cursor-pointer min-h-[44px] flex items-center text-ocean-text font-semibold; }
.globe-list ul { @apply list-none flex flex-col gap-1 pb-1; }
.globe-list li { @apply py-1; }
</style>

<!-- Marker creati da MapLibre fuori dallo scope del componente -->
<style>
.globe-pin {
  width: 22px; height: 22px; border-radius: 50%; padding: 0; cursor: pointer;
  background: rgb(var(--color-sand)); border: 3px solid rgb(var(--color-ink));
  color: rgb(var(--color-on-primary)); font: 800 12px/1 inherit; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 6px rgba(0,0,0,.45);
}
.globe-pin-cluster { width: 30px; height: 30px; }
.globe-pin:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.globe-me { position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.globe-me-dot { position: relative; width: 16px; height: 16px; border-radius: 50%; background: rgb(var(--color-ocean)); border: 3px solid #fff; box-sizing: border-box; }
.globe-me-pulse { position: absolute; width: 16px; height: 16px; border-radius: 50%; background: rgb(var(--color-ocean)); animation: globe-pulse 2s ease-out infinite; }
@keyframes globe-pulse { from { transform: scale(1); opacity: .7; } to { transform: scale(2.6); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .globe-me-pulse { animation: none; } }
.maplibregl-ctrl-attrib, .maplibregl-canvas { outline: none; }
</style>
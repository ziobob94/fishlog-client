<template>
  <section class="globe-card rounded-signature" :aria-label="t('globe.title')">
    <p class="globe-eyebrow">{{ t('globe.eyebrow') }}</p>
    <h2 class="globe-title">{{ t('globe.count', { n: spots.length }, spots.length) }}</h2>

    <div ref="stage" class="globe-stage">
      <svg
        ref="svgEl" class="globe-svg" :viewBox="`0 0 ${SIZE} ${SIZE}`"
        role="img" :aria-label="ariaLabel"
        @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
      >
        <defs>
          <radialGradient id="globe-sea" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stop-color="rgb(var(--color-sea-deep))" />
            <stop offset="100%" stop-color="rgb(var(--color-ink))" />
          </radialGradient>
        </defs>
        <circle :cx="C" :cy="C" :r="radius" fill="url(#globe-sea)" stroke="rgb(var(--color-border))" stroke-width="1.5" />
        <path :d="graticulePath" fill="none" stroke="rgb(var(--color-ocean-text))" stroke-opacity=".18" stroke-width="1" />
        <path :d="landPath" fill="rgb(var(--color-surface-2))" stroke="rgb(var(--color-border-light))" stroke-width=".8" />

        <!-- Posizione dell'utente -->
        <g v-if="mePos">
          <circle :cx="mePos.x" :cy="mePos.y" r="7" fill="rgb(var(--color-ocean))" stroke="#fff" stroke-width="2" />
          <circle v-if="!reduceMotion" :cx="mePos.x" :cy="mePos.y" r="7" fill="none" stroke="rgb(var(--color-ocean))" stroke-width="2" class="pulse" />
          <g :transform="`translate(${mePos.x} ${mePos.y - 22})`">
            <rect x="-34" y="-11" width="68" height="20" rx="10" fill="rgb(var(--color-ocean-text))" />
            <text y="3" text-anchor="middle" class="globe-tag">{{ t('globe.you') }}</text>
          </g>
        </g>

        <!-- Uscite (raggruppate se vicine) -->
        <g v-for="m in markers" :key="m.key">
          <circle
            :cx="m.x" :cy="m.y" :r="m.items.length > 1 ? 15 : 10"
            fill="rgb(var(--color-sand))" stroke="rgb(var(--color-ink))" stroke-width="3"
            class="marker" role="button" tabindex="0"
            :aria-label="markerLabel(m)"
            @pointerdown.stop @click="openMarker(m)" @keydown.enter.prevent="openMarker(m)" @keydown.space.prevent="openMarker(m)"
          />
          <text v-if="m.items.length > 1" :x="m.x" :y="m.y + 4" text-anchor="middle" class="marker-count" pointer-events="none">{{ m.items.length }}</text>
        </g>
      </svg>

      <div class="globe-controls">
        <button type="button" class="globe-btn" :aria-label="t('globe.zoomIn')" @click="zoomBy(1.3)"><AppIcon name="nuova-uscita" :size="20" /></button>
        <button type="button" class="globe-btn" :aria-label="t('globe.zoomOut')" @click="zoomBy(1 / 1.3)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <button type="button" class="globe-btn" :aria-label="t('globe.myPosition')" :title="t('globe.myPosition')" @click="goToMe"><AppIcon name="luogo" :size="20" /></button>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import land110 from 'world-atlas/land-110m.json'
import api from '../utils/api.js'
import AppIcon from './AppIcon.vue'

const { t } = useI18n()

const SIZE = 360
const C = SIZE / 2
const BASE_R = 150

const landGeo = feature(land110, land110.objects.land)
const graticule = geoGraticule10()

const rotation = ref([-12, -38])   // [lambda, phi] → centrato sull'Italia
const scale = ref(1)
const spots = ref([])
const loading = ref(true)
const selected = ref(null)
const me = ref(null)
const geoError = ref('')
const reduceMotion = ref(false)
const svgEl = ref(null)
const stage = ref(null)

const radius = computed(() => BASE_R * scale.value)
const projection = computed(() =>
  geoOrthographic().translate([C, C]).scale(radius.value).rotate([rotation.value[0], rotation.value[1]]).clipAngle(90)
)
const pathGen = computed(() => geoPath(projection.value))
const landPath = computed(() => pathGen.value(landGeo) || '')
const graticulePath = computed(() => pathGen.value(graticule) || '')

// Punto visibile? (faccia anteriore del globo)
function project(lng, lat) {
  const p = projection.value([lng, lat])
  if (!p) return null
  const [lam, phi] = rotation.value
  const cx = -lam, cy = -phi
  const rad = Math.PI / 180
  const cos = Math.sin(cy * rad) * Math.sin(lat * rad) + Math.cos(cy * rad) * Math.cos(lat * rad) * Math.cos((lng - cx) * rad)
  if (cos <= 0) return null
  return { x: p[0], y: p[1] }
}

const mePos = computed(() => me.value ? project(me.value.lng, me.value.lat) : null)

// Raggruppa i segnaposto vicini nello spazio schermo
const markers = computed(() => {
  const out = []
  for (const s of spots.value) {
    const pt = project(s.location.coords.lng, s.location.coords.lat)
    if (!pt) continue
    const near = out.find(m => Math.hypot(m.x - pt.x, m.y - pt.y) < 20)
    if (near) {
      near.items.push(s)
    } else {
      out.push({ key: s._id, x: pt.x, y: pt.y, items: [s] })
    }
  }
  return out
})

const ariaLabel = computed(() => t('globe.aria', { n: spots.value.length }, spots.value.length))
const markerLabel = m => m.items.length > 1
  ? t('globe.clusterLabel', { n: m.items.length })
  : (m.items[0].title || m.items[0].location?.name || t('session.untitled'))
const fmtDate = d => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })

function openMarker(m) { selected.value = m }

// ── Trascinamento: la rotazione segue solo il movimento orizzontale o libero
// con il mouse; sul tocco, touch-action: pan-y lascia scorrere la pagina in verticale.
let drag = null
function onDown(e) {
  if (e.target.closest?.('.marker')) return
  drag = { x: e.clientX, y: e.clientY, rot: [...rotation.value] }
  svgEl.value?.setPointerCapture?.(e.pointerId)
}
function onMove(e) {
  if (!drag) return
  const k = 0.35 / scale.value
  const dx = e.clientX - drag.x
  const dy = e.pointerType === 'touch' ? 0 : e.clientY - drag.y
  rotation.value = [drag.rot[0] + dx * k, Math.max(-85, Math.min(85, drag.rot[1] - dy * k))]
}
function onUp() { drag = null }

function zoomBy(f) { scale.value = Math.max(0.8, Math.min(4, scale.value * f)) }

let anim = null
function rotateTo(lng, lat, zoom) {
  const target = [-lng, -lat]
  if (reduceMotion.value) {
    rotation.value = target
    if (zoom) scale.value = zoom
    return
  }
  const from = [...rotation.value]
  const fromScale = scale.value
  const t0 = performance.now()
  cancelAnimationFrame(anim)
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 600)
    const e = 1 - Math.pow(1 - k, 3)
    rotation.value = [from[0] + (target[0] - from[0]) * e, from[1] + (target[1] - from[1]) * e]
    if (zoom) scale.value = fromScale + (zoom - fromScale) * e
    if (k < 1) anim = requestAnimationFrame(step)
  }
  anim = requestAnimationFrame(step)
}

function showAll() {
  if (!spots.value.length) return
  const pts = spots.value.map(s => s.location.coords)
  const lat = pts.reduce((a, p) => a + p.lat, 0) / pts.length
  const lng = pts.reduce((a, p) => a + p.lng, 0) / pts.length
  rotateTo(lng, lat, 1.25)
}

// La posizione si chiede solo al tocco del pulsante
function goToMe() {
  geoError.value = ''
  if (me.value) { rotateTo(me.value.lng, me.value.lat, 2); return }
  if (!navigator.geolocation) { geoError.value = t('globe.geoUnavailable'); return }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      me.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      rotateTo(me.value.lng, me.value.lat, 2)
    },
    () => { geoError.value = t('globe.geoDenied') },
    { timeout: 8000 }
  )
}

onMounted(async () => {
  reduceMotion.value = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  try {
    const { data } = await api.get('/sessions', { params: { mine: true, limit: 200 } })
    spots.value = (data.data || []).filter(s =>
      typeof s.location?.coords?.lat === 'number' && typeof s.location?.coords?.lng === 'number')
    if (spots.value.length) showAll()
  } catch { /* il globo resta vuoto */ }
  finally { loading.value = false }
})
onBeforeUnmount(() => cancelAnimationFrame(anim))
</script>

<style scoped>
.globe-card { @apply bg-surface border border-border/60 p-4 mb-6; }
.globe-eyebrow { @apply text-xs font-bold uppercase text-ocean-text; letter-spacing: 0.14em; }
.globe-title { @apply text-xl mt-1 mb-3; }
.globe-stage { @apply relative rounded-xl overflow-hidden bg-ink mx-auto; max-width: 480px; }
.globe-svg { @apply block w-full h-auto select-none; max-height: 420px; touch-action: pan-y; cursor: grab; }
.globe-svg:active { cursor: grabbing; }
.globe-tag { font-size: 11px; font-weight: 700; fill: rgb(var(--color-on-primary)); }
.marker { cursor: pointer; }
.marker:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.marker-count { font-size: 12px; font-weight: 800; fill: rgb(var(--color-on-primary)); }
.pulse { transform-box: fill-box; transform-origin: center; animation: globe-pulse 2s ease-out infinite; }
@keyframes globe-pulse { from { transform: scale(1); opacity: .8; } to { transform: scale(2.6); opacity: 0; } }

.globe-controls { @apply absolute right-2 top-2 flex flex-col gap-2; }
.globe-btn {
  @apply flex items-center justify-center w-11 h-11 rounded-xl bg-surface/90 border border-border text-foam cursor-pointer;
}
.globe-btn:hover { @apply border-ocean; }
.globe-btn:disabled { @apply opacity-40 cursor-not-allowed; }

.globe-popup { @apply absolute left-2 right-14 bottom-2 rounded-lg bg-surface border border-border p-3 pr-12; }
.globe-popup-close { @apply absolute right-1 top-1 w-11 h-11 flex items-center justify-center bg-transparent border-none text-muted cursor-pointer; }
.globe-popup-list { @apply list-none flex flex-col gap-1 max-h-40 overflow-y-auto; }
.globe-popup-item { @apply flex flex-col min-h-[44px] justify-center text-foam no-underline; }

.globe-legend { @apply flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted; }
.legend-item { @apply inline-flex items-center gap-1.5; }
.legend-hint { @apply ml-auto text-xs; }
.dot { @apply inline-block w-3 h-3 rounded-full; }
.dot-me { @apply bg-ocean; box-shadow: 0 0 0 2px #fff; }
.dot-spot { @apply bg-sand; }
.globe-error { @apply text-danger-text text-sm mt-2; }

.globe-list { @apply mt-3 text-sm; }
.globe-list summary { @apply cursor-pointer min-h-[44px] flex items-center text-ocean-text font-semibold; }
.globe-list ul { @apply list-none flex flex-col gap-1 pb-1; }
.globe-list li { @apply py-1; }
</style>

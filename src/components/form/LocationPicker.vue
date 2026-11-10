<template>
  <div class="location-picker">
    <div v-if="name !== undefined" class="name-wrap">
      <input
        class="name-input"
        type="text"
        autocomplete="off"
        :value="name"
        @input="onNameInput"
        @keydown.enter.prevent="results[0] && pick(results[0])"
        :placeholder="namePlaceholder || t('locationPicker.namePlaceholder')"
      />
      <ul v-if="results.length" class="results" role="listbox">
        <li v-for="r in results" :key="r.name + r.lat" role="option">
          <button type="button" @click="pick(r)">{{ r.name }}</button>
        </li>
      </ul>
    </div>
    <p class="picker-hint">{{ t('locationPicker.hint') }}</p>
    <div ref="mapEl" class="map-picker"></div>
    <p v-if="error" class="picker-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildStyle, readBasemap, COOP_LOCALE, loadMapLibre, searchPlaces, reversePlace } from '../../utils/mapStyle.js'
import { useThemeStore } from '../../stores/theme.js'

// Selettore luogo: cerca per nome oppure tocca la mappa per impostare le
// coordinate. MapLibre + Nominatim (OpenStreetMap), nessuna chiave API.
const { t } = useI18n()
const theme = useThemeStore()
const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  name: { type: String, default: undefined },
  namePlaceholder: { type: String, default: '' },
})
const emit = defineEmits(['update:lat', 'update:lng', 'update:name'])

const mapEl = ref(null)
const results = ref([])
const error = ref('')
let maplibre = null
let map = null
let marker = null
let searchTimer = null

function setPosition(lat, lng, zoom) {
  if (!map) return
  if (marker) marker.setLngLat([lng, lat])
  else marker = new maplibre.Marker({ color: '#f59e0b' }).setLngLat([lng, lat]).addTo(map)
  map.easeTo({ center: [lng, lat], zoom: zoom ?? Math.max(map.getZoom(), 12), duration: 400 })
}

function onNameInput(e) {
  const value = e.target.value
  emit('update:name', value)
  clearTimeout(searchTimer)
  error.value = ''
  if (value.trim().length < 3) { results.value = []; return }
  searchTimer = setTimeout(async () => {
    try { results.value = await searchPlaces(value.trim()) }
    catch { results.value = []; error.value = t('locationPicker.searchError') }
  }, 500)
}

function pick(r) {
  results.value = []
  emit('update:name', r.name)
  emit('update:lat', r.lat)
  emit('update:lng', r.lng)
  setPosition(r.lat, r.lng, 13)
}

onMounted(async () => {
  try {
    maplibre = await loadMapLibre()
    const hasCoords = props.lat && props.lng
    map = new maplibre.Map({
      container: mapEl.value,
      style: buildStyle({ basemap: readBasemap(), dark: theme.mode !== 'light' }),
      center: hasCoords ? [props.lng, props.lat] : [12.5, 42.5],
      zoom: hasCoords ? 13 : 5,
      cooperativeGestures: true, locale: COOP_LOCALE,
      dragRotate: false, pitchWithRotate: false, touchPitch: false
    })
    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
    if (hasCoords) marker = new maplibre.Marker({ color: '#f59e0b' }).setLngLat([props.lng, props.lat]).addTo(map)

    map.on('click', async (e) => {
      const lat = parseFloat(e.lngLat.lat.toFixed(6))
      const lng = parseFloat(e.lngLat.lng.toFixed(6))
      emit('update:lat', lat)
      emit('update:lng', lng)
      setPosition(lat, lng)
      if (props.name !== undefined) {
        try { const n = await reversePlace(lat, lng); if (n) emit('update:name', n) } catch { /* il nome resta com'è */ }
      }
    })
  } catch {
    error.value = t('locationPicker.mapError')
  }
})

watch(() => [props.lat, props.lng], ([lat, lng]) => {
  if (!map || !lat || !lng) return
  setPosition(lat, lng)
})

onUnmounted(() => { clearTimeout(searchTimer); map?.remove(); map = null })
</script>

<style scoped>
.location-picker { display: flex; flex-direction: column; gap: 0.4rem; }
.name-wrap { position: relative; }
.name-input { @apply text-sm; }
.results {
  @apply absolute left-0 right-0 top-full mt-1 z-20 list-none bg-surface-2 border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto;
}
.results button {
  @apply block w-full text-left text-sm px-3 py-2.5 min-h-[44px] bg-transparent border-none text-foam cursor-pointer hover:bg-surface;
}
.picker-hint { font-size: 0.75rem; color: rgb(var(--color-muted)); }
.picker-error { @apply text-danger-text text-sm; }
.map-picker {
  height: 300px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgb(var(--color-border));
  background: rgb(var(--color-surface-2));
  cursor: crosshair;
}
</style>

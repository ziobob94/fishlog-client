<template>
  <div class="location-picker">
    <p class="picker-hint">Clicca sulla mappa per impostare le coordinate</p>
    <div ref="mapEl" class="map-picker"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon   from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
})
const emit = defineEmits(['update:lat', 'update:lng'])

const mapEl = ref(null)
let map    = null
let marker = null

onMounted(() => {
  const hasCoords = props.lat && props.lng
  const center    = hasCoords ? [props.lat, props.lng] : [42.5, 12.5]
  const zoom      = hasCoords ? 13 : 6

  map = L.map(mapEl.value).setView(center, zoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  if (hasCoords) {
    marker = L.marker([props.lat, props.lng]).addTo(map)
  }

  map.on('click', (e) => {
    const lat = parseFloat(e.latlng.lat.toFixed(6))
    const lng = parseFloat(e.latlng.lng.toFixed(6))
    emit('update:lat', lat)
    emit('update:lng', lng)
    if (marker) {
      marker.setLatLng([lat, lng])
    } else {
      marker = L.marker([lat, lng]).addTo(map)
    }
  })
})

watch(() => [props.lat, props.lng], ([lat, lng]) => {
  if (!map || !lat || !lng) return
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng]).addTo(map)
  }
  map.panTo([lat, lng])
})

onUnmounted(() => { map?.remove() })
</script>

<style scoped>
.location-picker { display: flex; flex-direction: column; gap: 0.4rem; }
.picker-hint { font-size: 0.75rem; color: var(--text-muted, #6b8fa8); }
.map-picker {
  height: 300px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border, #2a3f55);
  cursor: crosshair;
}
</style>

<template>
  <div ref="mapEl" class="map-display"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon   from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
})

const mapEl = ref(null)
let map = null

onMounted(() => {
  map = L.map(mapEl.value).setView([props.lat, props.lng], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)
  L.marker([props.lat, props.lng]).addTo(map)
})

onUnmounted(() => { map?.remove() })
</script>

<style scoped>
.map-display {
  height: 280px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border, #2a3f55);
}
</style>

<template>
  <div ref="mapEl" class="map-display"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { loadGoogleMaps } from '../utils/googleMaps.js'

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
})

const mapEl = ref(null)
let map = null

onMounted(async () => {
  const gmaps = await loadGoogleMaps()
  const center = { lat: props.lat, lng: props.lng }
  map = new gmaps.Map(mapEl.value, {
    center,
    zoom: 13,
    mapTypeId: gmaps.MapTypeId.HYBRID,
    streetViewControl: false,
  })
  new gmaps.Marker({ position: center, map })
})

onUnmounted(() => { map = null })
</script>

<style scoped>
.map-display {
  height: 280px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border, #2a3f55);
}
</style>

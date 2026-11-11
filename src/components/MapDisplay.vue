<template>
  <div class="map-wrap">
    <div ref="mapEl" class="map-display"></div>
    <p v-if="err" class="map-err" role="alert">{{ err }}</p>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadMap, placesMessage, reportMapError, placesStatus } from '../utils/places.js'

// Mappa di dettaglio con segnaposto (Google Maps, caricata solo quando serve).
const { t } = useI18n()
const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
})

const mapEl = ref(null)
const err = ref('')
let map = null

onMounted(async () => {
  if (!import.meta.env.VITE_GOOGLE_MAPS_KEY) { err.value = t('placeInput.keyMissing'); return }
  try {
    const { Map } = await loadMap()
    const pos = { lat: props.lat, lng: props.lng }
    map = new Map(mapEl.value, {
      center: pos, zoom: 12, mapTypeId: 'hybrid', gestureHandling: 'cooperative',
      zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false
    })
    new window.google.maps.Marker({ position: pos, map })
  } catch (e) { reportMapError(e); err.value = placesMessage(t) || t('globe.mapError') }
})
watch(() => [placesStatus.error, placesStatus.code], () => { if (placesStatus.error) err.value = placesMessage(t) })

onUnmounted(() => { map = null })
</script>

<style scoped>
.map-display {
  height: 280px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgb(var(--color-border));
  background: rgb(var(--color-surface-2));
}
.map-err { margin-top: 6px; font-size: 13px; color: rgb(var(--color-danger-text, 248 113 113)); }
</style>

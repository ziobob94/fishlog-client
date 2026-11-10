<template>
  <div ref="mapEl" class="map-display"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { buildStyle, readBasemap, COOP_LOCALE, loadMapLibre } from '../utils/mapStyle.js'
import { useThemeStore } from '../stores/theme.js'

// Mappa di dettaglio con segnaposto (MapLibre, caricata solo quando serve).
const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
})

const theme = useThemeStore()
const mapEl = ref(null)
let map = null

onMounted(async () => {
  try {
    const maplibre = await loadMapLibre()
    map = new maplibre.Map({
      container: mapEl.value,
      style: buildStyle({ basemap: readBasemap(), dark: theme.mode !== 'light' }),
      center: [props.lng, props.lat], zoom: 12,
      cooperativeGestures: true, locale: COOP_LOCALE,
      dragRotate: false, pitchWithRotate: false, touchPitch: false
    })
    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
    new maplibre.Marker({ color: '#f59e0b' }).setLngLat([props.lng, props.lat]).addTo(map)
  } catch { /* la mappa resta vuota */ }
})

onUnmounted(() => { map?.remove(); map = null })
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
</style>

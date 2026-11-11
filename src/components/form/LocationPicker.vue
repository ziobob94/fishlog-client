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
        <li v-for="(r, i) in results" :key="i" role="option">
          <button type="button" @click="pick(r)">{{ r.title }}<small v-if="r.sub"> · {{ r.sub }}</small></button>
        </li>
      </ul>
    </div>
    <p class="picker-hint">{{ t('locationPicker.hint') }}</p>
    <div ref="mapEl" class="map-picker" data-no-sheet-drag></div>
    <p v-if="error" class="picker-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchPlaceOptions, resolveOption, reverseGeocode, loadMap, placesStatus } from '../../utils/places.js'
import { useThemeStore } from '../../stores/theme.js'

// Selettore luogo: cerca per nome oppure tocca la mappa per impostare le coordinate.
// Google Maps + Places + Geocoding (vedi utils/places.js). Ogni scelta emette anche
// `place` con nome, regione, provincia, comune, paese e coordinate calcolati insieme.
const { t } = useI18n()
const theme = useThemeStore()
const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  name: { type: String, default: undefined },
  namePlaceholder: { type: String, default: '' },
  greedy: { type: Boolean, default: false },   // dentro un foglio: la mappa prende tutti i gesti (un dito sposta, due zoomano)
})
const emit = defineEmits(['update:lat', 'update:lng', 'update:name', 'place'])

const mapEl = ref(null)
const results = ref([])
const error = ref('')
let map = null
let marker = null
let searchTimer = null

function setPosition(lat, lng, zoom) {
  if (!map) return
  const pos = { lat, lng }
  if (marker) marker.setPosition(pos)
  else marker = new window.google.maps.Marker({ position: pos, map })
  map.panTo(pos)
  if (zoom || map.getZoom() < 12) map.setZoom(zoom || 12)
}

function onNameInput(e) {
  const value = e.target.value
  emit('update:name', value)
  clearTimeout(searchTimer)
  error.value = ''
  if (value.trim().length < 3) { results.value = []; return }
  searchTimer = setTimeout(async () => { results.value = await searchPlaceOptions(value.trim()) }, 300)
}

async function pick(r) {
  results.value = []
  const p = await resolveOption(r)
  if (!p) return
  emit('update:name', p.name)
  emit('update:lat', p.lat)
  emit('update:lng', p.lng)
  emit('place', p)
  setPosition(p.lat, p.lng, 13)
}

onMounted(async () => {
  try {
    const { Map } = await loadMap()
    const hasCoords = props.lat && props.lng
    map = new Map(mapEl.value, {
      center: hasCoords ? { lat: props.lat, lng: props.lng } : { lat: 42.5, lng: 12.5 },
      zoom: hasCoords ? 13 : 5,
      gestureHandling: props.greedy ? 'greedy' : 'cooperative', streetViewControl: false, fullscreenControl: false, mapTypeControlOptions: { mapTypeIds: ['roadmap', 'hybrid'] },
      clickableIcons: false
    })
    if (hasCoords) setPosition(props.lat, props.lng)
    map.addListener('click', async (e) => {
      const lat = parseFloat(e.latLng.lat().toFixed(6))
      const lng = parseFloat(e.latLng.lng().toFixed(6))
      emit('update:lat', lat)
      emit('update:lng', lng)
      setPosition(lat, lng)
      const p = await reverseGeocode(lat, lng)
      if (p) { if (props.name !== undefined) emit('update:name', p.name); emit('place', p) }
    })
  } catch {
    error.value = placesStatus.error === 'missing' ? t('placeInput.keyMissing') : placesStatus.error === 'rejected' ? t('placeInput.keyRejected') : t('locationPicker.mapError')
  }
})

watch(() => [props.lat, props.lng], ([lat, lng]) => {
  if (!map || !lat || !lng) return
  setPosition(lat, lng)
})
watch(() => placesStatus.error, (e) => { if (e === 'rejected') error.value = t('placeInput.keyRejected') })

onUnmounted(() => { clearTimeout(searchTimer); map = null; marker = null })
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
  touch-action: none;
}
</style>

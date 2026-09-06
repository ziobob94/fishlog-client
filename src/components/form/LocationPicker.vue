<template>
  <div class="location-picker">
    <input
      v-if="name !== undefined"
      ref="nameInputEl"
      class="name-input"
      type="text"
      :value="name"
      @input="e => emit('update:name', e.target.value)"
      :placeholder="namePlaceholder || t('locationPicker.namePlaceholder')"
    />
    <p class="picker-hint">{{ t('locationPicker.hint') }}</p>
    <div ref="mapEl" class="map-picker"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadGoogleMaps } from '../../utils/googleMaps.js'

const { t } = useI18n()
const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  name: { type: String, default: undefined },
  namePlaceholder: { type: String, default: '' },
})
const emit = defineEmits(['update:lat', 'update:lng', 'update:name'])

const mapEl = ref(null)
const nameInputEl = ref(null)
let map    = null
let marker = null
let geocoder = null

function setPosition(lat, lng) {
  const position = { lat, lng }
  if (marker) {
    marker.setPosition(position)
  } else {
    marker = new window.google.maps.Marker({ position, map })
  }
  map.panTo(position)
}

function reverseGeocode(lat, lng) {
  if (!geocoder) return
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    if (status === 'OK' && results?.[0]) {
      emit('update:name', results[0].formatted_address)
    }
  })
}

onMounted(async () => {
  const gmaps = await loadGoogleMaps()
  geocoder = new gmaps.Geocoder()

  const hasCoords = props.lat && props.lng
  const center    = hasCoords ? { lat: props.lat, lng: props.lng } : { lat: 42.5, lng: 12.5 }
  const zoom      = hasCoords ? 13 : 6

  map = new gmaps.Map(mapEl.value, {
    center,
    zoom,
    mapTypeId: gmaps.MapTypeId.HYBRID,
    streetViewControl: false,
  })

  if (hasCoords) {
    marker = new gmaps.Marker({ position: center, map })
  }

  map.addListener('click', (e) => {
    const lat = parseFloat(e.latLng.lat().toFixed(6))
    const lng = parseFloat(e.latLng.lng().toFixed(6))
    emit('update:lat', lat)
    emit('update:lng', lng)
    setPosition(lat, lng)
    reverseGeocode(lat, lng)
  })

  if (props.name !== undefined && nameInputEl.value) {
    const autocomplete = new gmaps.places.Autocomplete(nameInputEl.value, {
      fields: ['geometry', 'formatted_address', 'name'],
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry?.location) return
      const lat = parseFloat(place.geometry.location.lat().toFixed(6))
      const lng = parseFloat(place.geometry.location.lng().toFixed(6))
      emit('update:name', place.formatted_address || place.name)
      emit('update:lat', lat)
      emit('update:lng', lng)
      map.setZoom(13)
      setPosition(lat, lng)
    })
  }
})

watch(() => [props.lat, props.lng], ([lat, lng]) => {
  if (!map || !lat || !lng) return
  setPosition(lat, lng)
})

onUnmounted(() => { map = null })
</script>

<style scoped>
.location-picker { display: flex; flex-direction: column; gap: 0.4rem; }
.name-input { @apply text-sm; }
.picker-hint { font-size: 0.75rem; color: var(--text-muted, #6b8fa8); }
.map-picker {
  height: 300px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border, #2a3f55);
  cursor: crosshair;
}
</style>

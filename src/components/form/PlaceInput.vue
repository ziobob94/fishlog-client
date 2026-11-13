<template>
  <div class="place">
    <div class="place-row">
      <div class="place-field">
        <input :id="id" ref="inp" :value="modelValue" type="text" class="fl-inp place-inp" :class="{ 'fl-err': invalid }" :aria-invalid="invalid || undefined"
          :aria-required="required || undefined" :placeholder="placeholder" autocomplete="off" role="combobox" :aria-expanded="open && options.length > 0" aria-autocomplete="list"
          @input="onInput" @focus="onFocus" @blur="closeSoon" />
        <ul v-if="open && options.length" class="place-list" :class="{ up: dropUp }" :style="listStyle" role="listbox">
          <li v-for="(o, i) in options" :key="i" role="option">
            <button type="button" class="place-opt" @mousedown.prevent @click="pick(o)">
              <span class="place-ic"><MapPin :size="18" /></span>
              <span class="place-tx"><strong>{{ o.title }}</strong><small>{{ o.sub }}</small></span>
            </button>
          </li>
        </ul>
      </div>
      <button type="button" class="place-btn" :aria-label="t('placeInput.useMyPosition')" :title="t('placeInput.useMyPosition')" :disabled="locating" @click="locate">
        <span v-if="locating" class="m-spinner" style="width:16px;height:16px"></span><LocateFixed v-else :size="20" />
      </button>
      <button type="button" class="place-btn" :aria-label="t('placeInput.pickOnMap')" :title="t('placeInput.pickOnMap')" @click="mapOpen = true"><MapIcon :size="20" /></button>
    </div>
    <p v-if="msg || statusMsg" class="fl-hint place-msg" :class="{ 'fl-error': !!statusMsg }" role="status">{{ statusMsg || msg }}</p>

    <BottomSheet v-model="mapOpen" :label="t('placeInput.pickOnMap')">
      <div class="map-sheet">
        <h2 class="map-title">{{ t('placeInput.pickOnMap') }}</h2>
        <LocationPicker v-if="mapOpen" greedy :lat="lat" :lng="lng" :name="draft.name" @update:name="v => draft.name = v" @update:lat="v => draft.lat = v" @update:lng="v => draft.lng = v" @place="p => draft.place = p" />
        <button type="button" class="fl-btn1 m-press" :disabled="!draft.lat || !draft.lng" @click="confirmMap">{{ t('placeInput.useThisPoint') }}</button>
      </div>
    </BottomSheet>
  </div>
</template>

<script setup>
// Input luogo unico: suggerimenti mentre si digita, «usa la mia posizione» e scelta sulla
// mappa (pin al tocco + nome dal reverse geocoding). Nomi in italiano con ripiego in inglese
// (mai nella scrittura locale, es. giapponese). Aggiorna nome e coordinate insieme.
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, LocateFixed, Map as MapIcon } from 'lucide-vue-next'
import BottomSheet from '../motion/BottomSheet.vue'
import LocationPicker from './LocationPicker.vue'
import { searchPlaceOptions, resolveOption, reverseGeocode, placesStatus, placesMessage, hasGoogleKey } from '../../utils/places.js'

const { t } = useI18n()
const props = defineProps({
  modelValue: { type: String, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  id: { type: String, default: undefined },
  placeholder: { type: String, default: '' },
  invalid: Boolean,
  required: Boolean,
  alwaysDown: Boolean,   // il menu si apre sempre verso il basso (campo in cima alla pagina), con altezza limitata allo spazio visibile sopra la tastiera
  mode: { type: String, default: 'place' }   // 'city': nel campo va il comune; 'region': la regione/area, non il locale/punto di interesse
})
const emit = defineEmits(['update:modelValue', 'update:lat', 'update:lng', 'pick', 'place'])

const open = ref(false)
const options = ref([])
const locating = ref(false)
const msg = ref('')
const mapOpen = ref(false)
const draft = reactive({ name: '', lat: null, lng: null, place: null })
const statusMsg = computed(() => !hasGoogleKey() ? t('placeInput.keyMissing') : placesStatus.error ? placesMessage(t) : '')
let timer = null
const inp = ref(null)
const dropUp = ref(false)
const listMax = ref(0)
const listStyle = computed(() => (props.alwaysDown && listMax.value ? { maxHeight: `${listMax.value}px`, overflowY: 'auto' } : null))
// Apre verso l'alto se sotto non c'è spazio (barra in basso, tastiera): il menu non resta coperto.
function measure() {
  const r = inp.value?.getBoundingClientRect(); if (!r) return
  const vh = window.visualViewport?.height || window.innerHeight
  if (props.alwaysDown) { dropUp.value = false; listMax.value = Math.max(160, Math.floor(vh - r.bottom - 16)); return }
  dropUp.value = vh - r.bottom < 300 && r.top > 300 - 120
}

// Con la tastiera aperta porta il campo in cima all'area visibile, così i suggerimenti (sotto) restano in vista.
function onFocus() {
  open.value = true; measure()
  if (!props.alwaysDown) return
  setTimeout(() => { inp.value?.scrollIntoView({ block: 'start', behavior: 'smooth' }); setTimeout(measure, 350) }, 300)
}
function onViewport() { if (open.value) measure() }
window.visualViewport?.addEventListener('resize', onViewport)

// p = luogo completo {name, city, province, region, country, postalCode, lat, lng}
function set(p) {
  const name = (props.mode === 'city' ? (p.city || p.name) : props.mode === 'region' ? (p.region || p.name) : p.name) || ''
  const { lat, lng } = p
  emit('update:modelValue', name)
  if (lat != null && lng != null) { emit('update:lat', parseFloat(Number(lat).toFixed(6))); emit('update:lng', parseFloat(Number(lng).toFixed(6))) }
  emit('pick', { ...p, name, lat, lng })
  emit('place', { ...p, name, lat, lng })
}

function onInput(e) {
  const q = e.target.value
  emit('update:modelValue', q)
  msg.value = ''
  open.value = true
  measure()
  clearTimeout(timer)
  if (q.trim().length < 3) { options.value = []; return }
  timer = setTimeout(async () => {
    const r = await searchPlaceOptions(q.trim(), { kind: props.mode })
    if (inp.value && inp.value.value.trim() === q.trim()) { options.value = r; msg.value = r.length || statusMsg.value ? '' : t('placeInput.noResults') }
  }, 400)
}
async function pick(o) {
  clearTimeout(timer); options.value = []; open.value = false
  const p = await resolveOption(o)
  if (p) set(p)
}
function closeSoon() { setTimeout(() => { open.value = false }, 150) }

function locate() {
  if (!navigator.geolocation) { msg.value = t('placeInput.noGps'); return }
  locating.value = true; msg.value = ''
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords
    const p = await reverseGeocode(latitude, longitude)
    if (p) set(p); else msg.value = t('placeInput.noResults')
    locating.value = false
  }, () => { locating.value = false; msg.value = t('placeInput.gpsDenied') }, { timeout: 10000, enableHighAccuracy: true })
}

async function confirmMap() {
  const p = draft.place && draft.place.lat === draft.lat ? draft.place : await reverseGeocode(draft.lat, draft.lng)
  set({ ...(p || {}), name: p?.name || draft.name || props.modelValue, lat: draft.lat, lng: draft.lng })
  mapOpen.value = false
}

watch(mapOpen, (o) => { if (o) { draft.name = props.modelValue; draft.lat = props.lat; draft.lng = props.lng; draft.place = null } })
onBeforeUnmount(() => { clearTimeout(timer); window.visualViewport?.removeEventListener('resize', onViewport) })
</script>

<style scoped>
.place { position: relative; min-width: 0; }
.place-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.place-field { position: relative; flex: 1; min-width: 0; }
.place-inp { width: 100%; box-sizing: border-box; }
.place-btn { flex: none; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 14px; border: 1px solid var(--border-light); background: var(--surface-2); color: rgb(var(--color-ocean-text)); cursor: pointer; }
.place-list { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 50; margin: 0; padding: 6px; list-style: none; background: var(--surface); border: 1px solid var(--border-light); border-radius: 16px; box-shadow: 0 12px 30px rgba(0,0,0,.25); }
.place-list.up { top: auto; bottom: calc(100% + 6px); max-height: 42vh; overflow-y: auto; }
.place-opt { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 6px 8px; background: none; border: 0; border-radius: 12px; color: var(--foam); text-align: left; cursor: pointer; }
.place-opt:hover { background: var(--surface-2); }
.place-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; color: rgb(var(--color-ocean-text)); flex: none; }
.place-tx { display: flex; flex-direction: column; min-width: 0; }
.place-tx strong { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.place-tx small { font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.place-msg { margin-top: 6px; }
.map-sheet { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
.map-title { font-size: 20px; font-weight: 800; margin: 4px 0 0; color: var(--foam); }
</style>

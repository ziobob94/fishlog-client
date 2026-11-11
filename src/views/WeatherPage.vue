<template>
  <div class="wx-page">
    <PageHeader :title="t('weather.title')" back="/" />

    <WeatherPlaceBar :mode="mode" :place="store.place" :updated="updatedLabel" :offline="isOffline" :refreshing="store.refreshing"
      @here="goHere" @search="mode = 'search'" @pick="onPick" @refresh="refresh" />

    <!-- Stati senza dati -->
    <section v-if="!store.data && state === 'loading'" aria-live="polite"><WeatherSkeleton /></section>

    <section v-else-if="!store.data && state === 'denied'" class="wx-block wx-state" role="alert">
      <MapPinOff :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.denied.title') }}</h2><p>{{ t('weather.denied.text') }}</p>
      <div class="wx-actions"><button type="button" class="fl-btn1 m-press" @click="mode = 'search'">{{ t('weather.mode.search') }}</button>
        <button type="button" class="wx-icon-btn m-press" @click="helpOpen = true">{{ t('weather.help.open') }}</button></div>
    </section>

    <section v-else-if="!store.data && state === 'unavailable'" class="wx-block wx-state" role="alert">
      <MapPinOff :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.unavailable.title') }}</h2><p>{{ t('weather.unavailable.text') }}</p>
      <div class="wx-actions"><button type="button" class="fl-btn1 m-press" @click="goHere">{{ t('weather.retry') }}</button>
        <button type="button" class="wx-icon-btn m-press" @click="mode = 'search'">{{ t('weather.mode.search') }}</button></div>
    </section>

    <section v-else-if="!store.data && state === 'offline'" class="wx-block wx-state" role="status">
      <WifiOff :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.offline.title') }}</h2><p>{{ t('weather.offline.empty') }}</p>
    </section>

    <section v-else-if="!store.data && state === 'error'" class="wx-block wx-state" role="alert">
      <CloudOff :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.error.title') }}</h2><p>{{ t('weather.error.text') }}</p>
      <button type="button" class="fl-btn1 m-press" @click="refresh(true)">{{ t('weather.retry') }}</button>
    </section>

    <section v-else-if="!store.data && !store.place && state === 'idle'" class="wx-block wx-state">
      <MapPin :size="32" aria-hidden="true" /><h2 class="wx-h">{{ t('weather.noPlace.title') }}</h2><p>{{ t('weather.noPlace.text') }}</p>
      <div class="wx-actions"><button type="button" class="fl-btn1 m-press" @click="goHere">{{ t('weather.mode.here') }}</button>
        <button type="button" class="wx-icon-btn m-press" @click="mode = 'search'">{{ t('weather.mode.search') }}</button></div>
    </section>

    <!-- Dati -->
    <template v-else-if="store.data">
      <div v-if="isOffline" class="wx-banner" role="status"><WifiOff :size="18" aria-hidden="true" style="flex:none;margin-top:2px" />
        <span><b>{{ t('weather.offline.title') }}</b> {{ t('weather.offline.banner', { time: updatedLabel }) }}</span></div>
      <div v-else-if="store.failed" class="wx-banner" role="status"><CloudOff :size="18" aria-hidden="true" style="flex:none;margin-top:2px" />
        <span>{{ t('weather.error.stale', { time: updatedLabel }) }} <button type="button" class="wx-link" style="min-height:44px" @click="refresh(true)">{{ t('weather.retry') }}</button></span></div>
      <div v-else-if="store.data.degraded" class="wx-banner" role="status"><CloudOff :size="18" aria-hidden="true" style="flex:none;margin-top:2px" /><span>{{ t('weather.degraded', { time: updatedLabel }) }}</span></div>
      <p v-if="partial" class="wx-note" role="status" style="margin:0">{{ t('weather.partial') }}</p>

      <StaggerList class="wx-page">
        <div :style="{ '--i': 0 }" class="wx-grid wx-grid-2">
          <WeatherNow :view="store.data" />
          <WeatherSea :view="store.data" :now-iso="nowIso" />
        </div>
        <div :style="{ '--i': 1 }"><WeatherGlance :view="store.data" /></div>
        <div :style="{ '--i': 2 }"><WeatherHourly :view="store.data" :today="today" /></div>
        <div :style="{ '--i': 3 }"><WeatherDaily :view="store.data" :today="today" /></div>
        <div :style="{ '--i': 4 }"><CompareForecast /></div>
      </StaggerList>
      <p class="wx-note">{{ t('weather.disclaimer') }}</p>
    </template>

    <LocationHelp v-model="helpOpen" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { MapPin, MapPinOff, WifiOff, CloudOff } from 'lucide-vue-next'
import PageHeader from '../components/PageHeader.vue'
import StaggerList from '../components/motion/StaggerList.vue'
import WeatherPlaceBar from '../components/weather/WeatherPlaceBar.vue'
import WeatherSkeleton from '../components/weather/WeatherSkeleton.vue'
import WeatherNow from '../components/weather/WeatherNow.vue'
import WeatherSea from '../components/weather/WeatherSea.vue'
import WeatherGlance from '../components/weather/WeatherGlance.vue'
import WeatherHourly from '../components/weather/WeatherHourly.vue'
import WeatherDaily from '../components/weather/WeatherDaily.vue'
import CompareForecast from '../components/weather/CompareForecast.vue'
import LocationHelp from '../components/weather/LocationHelp.vue'
import { useWeatherStore } from '../stores/weather.js'
import { isPartial } from '../utils/weather.js'
import { reverseLabel } from '../utils/places.js'
import '../assets/weather.css'

const { t } = useI18n()
const store = useWeatherStore()
const route = useRoute()
// ?modo=cerca (dalla Home: «Scegli un luogo a mano») apre subito la ricerca, senza chiedere la posizione.
const mode = ref(route.query.modo === 'cerca' || store.place?.mode === 'search' ? 'search' : 'here')
const helpOpen = ref(false)
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
window.addEventListener('online', () => { online.value = true; if (store.place) refresh(true) })
window.addEventListener('offline', () => { online.value = false })

const state = computed(() => store.status)
const isOffline = computed(() => !online.value || store.offlineNow)
const partial = computed(() => isPartial(store.data))
const fmtClock = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })
const updatedLabel = computed(() => (store.savedAt ? fmtClock(store.savedAt) : ''))
const today = computed(() => store.data?.daily?.[0]?.date || '')
const nowIso = computed(() => { const h = store.data?.hourly?.[0]?.time; return h ? String(h).slice(0, 16) : null })

async function nameIt() { // nome del luogo per «Qui» (reverse geocoding), solo se manca
  const p = store.place
  if (p && !p.name) store.setName(await reverseLabel(p.lat, p.lng))
}
async function goHere() {
  mode.value = 'here'
  if (await store.useHere()) { await store.load({ force: true }); nameIt() }
}
async function onPick(p) {
  if (!p || p.lat == null || p.lng == null) return
  store.pickPlace(p); await store.load({ force: true })
}
async function refresh(force = true) { store.clearFlags(); await store.load({ force }) }

onMounted(async () => {
  if (store.place) { await store.load(); nameIt() } // dato recente → nessuna chiamata
  else if (mode.value === 'here') await goHere()
})
watch(mode, m => { if (m === 'search' && store.status === 'denied') store.status = 'idle' })
</script>

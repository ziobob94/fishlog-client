<template>
  <!-- «Attività dei pesci»: sotto il meteo, sopra «Le mie località». Stima indicativa (livello 1-5 per l'ora corrente del luogo). -->
  <section v-if="place" class="fa" aria-labelledby="fa-title" :aria-busy="state === 'loading' ? 'true' : undefined">
    <div class="fa-head">
      <h2 id="fa-title" class="fa-title">{{ t('fishAct.title') }}</h2>
      <span class="wx-tag">{{ t('fishAct.tag') }}</span>
    </div>

    <div v-if="state === 'loading'" class="fa-sk">
      <p class="fa-sr" role="status">{{ t('fishAct.loading') }}</p>
      <div class="m-skeleton" style="height:28px;width:55%"></div>
      <div class="m-skeleton" style="height:10px;width:70%"></div>
      <div class="m-skeleton" style="height:16px"></div>
    </div>

    <div v-else-if="state === 'missing'" class="fa-missing">
      <p class="fa-missing-t">{{ t('fishAct.missingTitle') }}</p>
      <p class="fa-missing-p">{{ offlineNow ? t('fishAct.offlineMissing') : t('fishAct.missingText') }}</p>
      <button type="button" class="fa-retry m-press" :disabled="offlineNow || busy" @click="retry"><RefreshCw :size="16" aria-hidden="true" /> {{ t('fishAct.retry') }}</button>
    </div>

    <template v-else>
      <button type="button" class="fa-main m-press" aria-haspopup="dialog" @click="open = true">
        <span class="fa-level">
          <span class="fa-word">{{ word }}</span>
          <span class="fa-n wx-num" aria-hidden="true">{{ rec.level }}/5</span>
        </span>
        <FishMeter :level="rec.level" />
        <span class="fa-advice">{{ t(`fishAct.advice.${key}`) }}</span>
        <span class="fa-next"><span class="fa-next-k">{{ t('fishAct.nextWindow') }}</span> <span class="wx-num">{{ nextText }}</span></span>
        <FishFactors :factors="rec.factors" />
      </button>
      <p v-if="state === 'offline'" class="fa-stale" role="status"><WifiOff :size="14" aria-hidden="true" /> {{ t('fishAct.offlineStale', { time: clock(rec.savedAt) }) }}</p>
      <FishActivitySheet v-model="open" :rec="rec" :stale-time="state === 'offline' ? clock(rec.savedAt) : ''" />
    </template>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, WifiOff } from 'lucide-vue-next'
import FishMeter from './FishMeter.vue'
import FishFactors from './FishFactors.vue'
import FishActivitySheet from './FishActivitySheet.vue'
import { useFishActivityStore } from '../../stores/fishActivity.js'
import { useWeatherStore } from '../../stores/weather.js'
import { useOnline } from '../../composables/useOnline.js'
import { activityState, levelKey, clock } from '../../utils/fishActivity.js'
import '../../assets/weather.css'

const SEL = 'sel'
const { t } = useI18n()
const fish = useFishActivityStore()
const weather = useWeatherStore()
const online = useOnline()
const open = ref(false), busy = ref(false)

const place = computed(() => weather.place)
const spot = computed(() => (place.value ? { id: SEL, lat: place.value.lat, lon: place.value.lng } : null))
const rec = computed(() => {
  const r = fish.records[SEL]
  const p = place.value
  // il record vale solo per il luogo mostrato adesso
  return r && p && Math.abs((r.lat ?? p.lat) - p.lat) < 0.001 && Math.abs((r.lon ?? p.lng) - p.lng) < 0.001 ? r : null
})
const offlineNow = computed(() => !online.value)
const state = computed(() => activityState({ rec: rec.value, loading: fish.loading || busy.value || (!rec.value && online.value && !failed.value), online: online.value }))
const failed = ref(false)
const key = computed(() => levelKey(rec.value?.level))
const word = computed(() => t(`fishAct.levels.${key.value}`))
const nextText = computed(() => {
  const w = rec.value?.nextWindow
  if (!w) return t('fishAct.windowNone')
  return t(w.now ? 'fishAct.windowNow' : 'fishAct.windowRange', { from: w.from, to: w.to })
})

async function refresh(force = false) {
  if (!spot.value) return
  failed.value = false
  const r = await fish.load([spot.value], { force })
  if (r === 'error' || r === 'offline') failed.value = true
}
async function retry() { busy.value = true; try { await refresh(true) } finally { busy.value = false } }

onMounted(() => refresh())
watch(() => [place.value?.lat, place.value?.lng], () => refresh())
watch(online, on => { if (on) refresh() })
</script>

<style scoped>
.fa { display: grid; gap: 8px; margin: 0 0 16px; padding: 14px 16px; border-radius: 22px; background: rgb(var(--color-surface)); border: 1px solid rgb(var(--color-border)); }
.fa-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.fa-title { font-family: var(--font-display); font-size: 1.2rem; margin: 0; }
.fa-main { display: grid; gap: 8px; width: 100%; min-height: 44px; padding: 0; text-align: left; font: inherit; color: inherit; background: none; border: 0; border-radius: 14px; cursor: pointer; }
.fa-main:focus-visible, .fa-retry:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 4px; }
.fa-level { display: flex; align-items: baseline; gap: 10px; }
.fa-word { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; line-height: 1.1; }
.fa-n { font-size: .85rem; color: rgb(var(--color-muted)); }
.fa-advice { font-size: .92rem; line-height: 1.4; color: rgb(var(--color-foam)); }
.fa-next { font-size: .85rem; color: rgb(var(--color-muted)); }
.fa-next-k { font-weight: 700; }
.fa-stale { display: flex; align-items: center; gap: 6px; margin: 0; font-size: .8rem; color: rgb(var(--color-muted)); }
.fa-sk { display: grid; gap: 10px; }
.fa-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); margin: 0; }
.fa-missing { display: grid; gap: 6px; justify-items: start; }
.fa-missing-t { margin: 0; font-weight: 800; }
.fa-missing-p { margin: 0; font-size: .88rem; color: rgb(var(--color-muted)); }
.fa-retry { min-height: 44px; display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border: 1px solid rgb(var(--color-border-light)); border-radius: 12px; background: none; color: rgb(var(--color-ocean-text)); font: inherit; font-weight: 800; cursor: pointer; }
.fa-retry:disabled { opacity: .45; cursor: not-allowed; }
</style>

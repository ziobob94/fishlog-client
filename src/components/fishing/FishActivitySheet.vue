<template>
  <BottomSheet :model-value="modelValue" :label="t('fishAct.sheetTitle')" @update:model-value="$emit('update:modelValue', $event)">
    <div class="fs">
      <div class="fs-top">
        <h2 class="fs-title">{{ t('fishAct.sheetTitle') }}</h2>
        <span class="wx-tag">{{ t('fishAct.tag') }}</span>
      </div>
      <p class="fs-level"><span class="fs-word">{{ word }}</span> <span class="wx-num fs-n" aria-hidden="true">{{ rec.level }}/5</span></p>
      <FishMeter :level="rec.level" />
      <p class="fs-advice">{{ t(`fishAct.advice.${key}`) }}</p>
      <p v-if="staleTime" class="fs-stale" role="status">{{ t('fishAct.offlineStale', { time: staleTime }) }}</p>

      <h3 class="fs-h">{{ t('fishAct.hoursTitle') }}</h3>
      <p v-if="detail.loading" class="fs-muted" role="status">{{ t('fishAct.loading') }}</p>
      <FishHoursChart v-else-if="act" :hours="act.hours" :hour="rec.hour" :level="rec.level" :sunrise="sun.sunrise" :sunset="sun.sunset" :windows="act.windows" />
      <p v-else class="fs-muted">{{ t('fishAct.chartMissing') }}</p>

      <h3 class="fs-h">{{ t('fishAct.windowsTitle') }}</h3>
      <p class="fs-p wx-num">{{ windowsText(act?.windows || [], t('fishAct.windowNone')) }}</p>

      <h3 class="fs-h">{{ t('fishAct.factorsTitle') }}</h3>
      <ul class="fs-factors">
        <li v-for="f in factors" :key="f.key">
          <span class="fs-fname">{{ t(`fishAct.factors.${f.key}`) }} <span aria-hidden="true">{{ ARROW[f.effect] }}</span><span class="fs-sr">{{ t(`fishAct.effect.${f.effect}`) }}</span></span>
          <span v-if="f.text" class="fs-ftext">{{ f.text }}</span>
        </li>
      </ul>

      <button ref="howBtn" type="button" class="fs-how m-press" aria-haspopup="dialog" @click="howOpen = true"><Info :size="16" aria-hidden="true" /> {{ t('fishAct.how') }}</button>
      <button type="button" class="fs-close m-press" @click="$emit('update:modelValue', false)">{{ t('fishAct.close') }}</button>
    </div>
  </BottomSheet>

  <BottomSheet v-model="howOpen" :label="t('fishAct.howTitle')">
    <div class="fs">
      <h2 class="fs-title">{{ t('fishAct.howTitle') }}</h2>
      <p class="fs-p">{{ t('fishAct.howP1') }}</p>
      <ul class="fs-how-list"><li v-for="(x, i) in howList" :key="i">{{ x }}</li></ul>
      <p class="fs-p">{{ t('fishAct.howP2') }}</p>
      <button type="button" class="fs-close m-press" @click="howOpen = false">{{ t('fishAct.close') }}</button>
    </div>
  </BottomSheet>
</template>

<script setup>
// Dettaglio dell'attività: livello, 24 barre, finestre e fattori con spiegazione (stessa fonte del dettaglio giorno del Meteo).
// Il secondo foglio spiega il calcolo. Esc chiude il foglio in alto, il focus resta dentro (BottomSheet).
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Info } from 'lucide-vue-next'
import BottomSheet from '../motion/BottomSheet.vue'
import FishMeter from './FishMeter.vue'
import FishHoursChart from './FishHoursChart.vue'
import { useWeatherStore } from '../../stores/weather.js'
import { levelKey, visibleFactors, windowsText, EFFECT_ARROW as ARROW } from '../../utils/fishActivity.js'
import '../../assets/weather.css'

const props = defineProps({ modelValue: Boolean, rec: { type: Object, required: true }, staleTime: { type: String, default: '' } })
defineEmits(['update:modelValue'])
const { t, tm } = useI18n()
const weather = useWeatherStore()
const howOpen = ref(false)
const detail = ref({ loading: false, data: null })

const key = computed(() => levelKey(props.rec.level))
const word = computed(() => t(`fishAct.levels.${key.value}`))
const howList = computed(() => tm('fishAct.howList'))
const act = computed(() => detail.value.data?.activity || null)
const sun = computed(() => ({ sunrise: weather.data?.daily?.[0]?.sunrise ?? null, sunset: weather.data?.daily?.[0]?.sunset ?? null }))
// Spiegazione per fattore: il server dà il testo prudente; l'ordine e l'effetto sono quelli dell'ora corrente.
const factors = computed(() => {
  const text = new Map((act.value?.factors || []).map(f => [f.key, f.text]))
  return visibleFactors(props.rec.factors).map(f => ({ ...f, text: text.get(f.key) || '' }))
})

watch(() => props.modelValue, async open => {
  if (!open) { howOpen.value = false; return }
  detail.value = { loading: true, data: null }
  const r = await weather.loadFishing(props.rec.date)
  detail.value = { loading: false, data: r.data }
})
</script>

<style scoped>
.fs { display: grid; gap: 10px; padding-top: 4px; }
.fs-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.fs-title { font-family: var(--font-display); font-size: 1.3rem; margin: 0; }
.fs-level { margin: 0; display: flex; align-items: baseline; gap: 10px; }
.fs-word { font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; }
.fs-n { color: rgb(var(--color-muted)); }
.fs-advice, .fs-p { margin: 0; font-size: .95rem; line-height: 1.45; }
.fs-stale, .fs-muted { margin: 0; font-size: .85rem; color: rgb(var(--color-muted)); }
.fs-h { font-size: .8rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: rgb(var(--color-muted)); margin: 10px 0 0; }
.fs-factors { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.fs-fname { display: block; font-weight: 800; }
.fs-ftext { display: block; font-size: .9rem; line-height: 1.4; color: rgb(var(--color-muted)); }
.fs-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.fs-how-list { margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: .92rem; line-height: 1.4; }
.fs-how, .fs-close { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 14px; border-radius: 12px; font: inherit; font-weight: 800; cursor: pointer; }
.fs-how { border: 1px solid rgb(var(--color-border-light)); background: none; color: rgb(var(--color-ocean-text)); margin-top: 6px; }
.fs-close { border: 0; background: rgb(var(--color-surface-2)); color: inherit; }
.fs-how:focus-visible, .fs-close:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
</style>

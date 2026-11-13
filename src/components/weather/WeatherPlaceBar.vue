<template>
  <div class="wx-bar">
    <div class="wx-seg" role="group" :aria-label="t('weather.mode.label')" style="justify-self:start">
      <span class="wx-seg-ind" aria-hidden="true" :style="{ width: 'calc(50% - 3px)', transform: mode === 'search' ? 'translateX(100%)' : 'none' }" />
      <button type="button" :aria-pressed="mode === 'here'" @click="$emit('here')"><LocateFixed :size="16" style="display:inline;vertical-align:-3px" /> {{ t('weather.mode.here') }}</button>
      <button type="button" :aria-pressed="mode === 'search'" @click="$emit('search')"><Search :size="16" style="display:inline;vertical-align:-3px" /> {{ t('weather.mode.search') }}</button>
    </div>

    <div v-if="mode === 'search'" class="wx-search">
      <PlaceInput always-down v-model="query" :placeholder="t('weather.search.placeholder')" :lat="place?.lat ?? null" :lng="place?.lng ?? null" @place="p => $emit('pick', p)" />
      <div class="wx-chips" role="group" :aria-label="t('weather.search.zones')">
        <button v-for="z in zones" :key="z.key" type="button" class="wx-chip m-color" @click="$emit('pick', { name: t(`home.zones.items.${z.key}`), lat: z.lat, lng: z.lng })">{{ t(`home.zones.items.${z.key}`) }}</button>
      </div>
    </div>

    <div v-if="place" class="wx-bar-row">
      <div>
        <h2 class="wx-place">{{ placeName }}</h2>
        <p v-if="updated" class="wx-upd" role="status">{{ t('weather.updatedAt') }} <span class="wx-num">{{ updated }}</span></p>
      </div>
      <button type="button" class="wx-icon-btn m-press" :aria-disabled="offline || refreshing || undefined" :aria-label="refreshing ? t('weather.refreshing') : t('weather.refresh')" @click="!offline && !refreshing && $emit('refresh')">
        <span v-if="refreshing" class="m-spinner" style="width:16px;height:16px" aria-hidden="true"></span><RefreshCw v-else :size="18" aria-hidden="true" />
        <span>{{ refreshing ? t('weather.refreshingShort') : t('weather.refreshShort') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
// «Qui» (posizione del dispositivo) o «Cerca un luogo» (suggerimenti Google, posizione, mappa) + luogo e ora di aggiornamento.
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LocateFixed, Search, RefreshCw } from 'lucide-vue-next'
import PlaceInput from '../form/PlaceInput.vue'
const props = defineProps({
  mode: { type: String, default: 'here' }, place: { type: Object, default: null }, updated: { type: String, default: '' },
  offline: Boolean, refreshing: Boolean,
})
defineEmits(['here', 'search', 'pick', 'refresh'])
const { t } = useI18n()
const query = ref('')
watch(() => props.place?.name, n => { if (n && props.mode === 'search') query.value = n }, { immediate: true })
const placeName = computed(() => props.place?.name || (props.place?.mode === 'here' ? t('weather.yourPosition') : `${props.place?.lat?.toFixed(2)}, ${props.place?.lng?.toFixed(2)}`))
const zones = [
  { key: 'adriatic', lat: 43.6, lng: 14.0 }, { key: 'tyrrhenian', lat: 40.0, lng: 12.3 }, { key: 'ligurian', lat: 43.7, lng: 8.6 },
  { key: 'ionian', lat: 38.3, lng: 17.3 }, { key: 'sicily', lat: 37.2, lng: 12.2 },
]
</script>

<style scoped>
.wx-search { display: grid; gap: 10px; }
</style>

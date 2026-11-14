<template>
  <BottomSheet :model-value="modelValue" :label="t('favorites.addTitle')" @update:model-value="v => $emit('update:modelValue', v)">
    <div class="fa">
      <h2 class="fa-title">{{ t('favorites.addTitle') }}</h2>
      <label class="fa-label" for="fa-search">{{ t('favorites.searchLabel') }}</label>
      <PlaceInput id="fa-search" always-down v-model="query" :placeholder="t('favorites.searchPlaceholder')" @place="onPlace" />

      <div v-if="found" class="fa-row" role="group" :aria-label="t('favorites.result')">
        <button type="button" class="fa-name" @click="$emit('view', found); $emit('update:modelValue', false)"><MapPin :size="18" aria-hidden="true" /><span>{{ found.name }}</span></button>
        <FavoriteStar :place="found" show-message />
      </div>

      <div class="fa-row">
        <button type="button" class="fa-here m-press" :disabled="!here" @click="saveCurrent"><Navigation :size="18" aria-hidden="true" /> {{ t('favorites.saveCurrent') }}</button>
        <FavoriteStar v-if="here" :place="here" />
      </div>
      <p v-if="!here" class="fa-hint">{{ t('favorites.currentUnknown') }}</p>
      <p class="fa-hint wx-num">{{ t('favorites.count', { n: fav.count, max: MAX }) }}</p>
      <p v-if="fav.limitReached" class="fa-limit" role="status">{{ t('favorites.limit', { n: MAX }) }}</p>
    </div>
  </BottomSheet>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, Navigation } from 'lucide-vue-next'
import BottomSheet from '../motion/BottomSheet.vue'
import PlaceInput from '../form/PlaceInput.vue'
import FavoriteStar from './FavoriteStar.vue'
import { useFavoritesStore } from '../../stores/favorites.js'
import { useFavoriteActions } from '../../composables/useFavoriteActions.js'
import { MAX_FAVORITES as MAX } from '../../utils/favorites.js'
import { reverseLabel } from '../../utils/places.js'

const props = defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue', 'view'])
const { t } = useI18n()
const fav = useFavoritesStore()
const { addPlace, report } = useFavoriteActions()
const query = ref(''), found = ref(null), hereName = ref('')

const here = computed(() => {
  const h = fav.hereSpot
  return h ? { name: hereName.value || t('favorites.currentNamed'), lat: h.lat, lon: h.lon } : null
})
watch(() => props.modelValue, async open => {
  if (!open) { query.value = ''; found.value = null; return }
  const h = fav.hereSpot
  if (h && !hereName.value) { try { hereName.value = await reverseLabel(h.lat, h.lon) } catch { /* resta «Posizione attuale» */ } }
})
const onPlace = p => { if (p?.lat != null && p?.lng != null) found.value = { name: p.name || query.value, lat: p.lat, lon: p.lng } }
async function saveCurrent() {
  if (!here.value) return
  if (fav.findSame(here.value)) { report('duplicate', here.value.name); return }
  await addPlace(here.value)
}
</script>

<style scoped>
.fa { display: grid; gap: 12px; }
.fa-title { font-family: var(--font-display); font-size: 1.25rem; margin: 4px 0 0; }
.fa-label { font-size: .85rem; font-weight: 700; color: rgb(var(--color-muted)); }
.fa-row { display: flex; align-items: center; gap: 8px; }
.fa-name, .fa-here { flex: 1; min-height: 44px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 14px; border: 1px solid rgb(var(--color-border)); background: rgb(var(--color-surface-2)); color: rgb(var(--color-foam)); font: inherit; font-weight: 700; cursor: pointer; text-align: left; }
.fa-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fa-here:disabled { opacity: .5; cursor: not-allowed; }
.fa-name:focus-visible, .fa-here:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.fa-hint { margin: 0; font-size: .85rem; color: rgb(var(--color-muted)); }
.fa-limit { margin: 0; font-weight: 700; font-size: .9rem; color: rgb(var(--color-sand-text)); }
</style>

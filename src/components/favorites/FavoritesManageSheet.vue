<template>
  <BottomSheet :model-value="modelValue" :label="t('favorites.manageTitle')" @update:model-value="v => $emit('update:modelValue', v)">
    <div class="fm">
      <h2 class="fm-title">{{ t('favorites.manageTitle') }}</h2>
      <p class="fm-hint">{{ t('favorites.manageHint') }} <span class="wx-num">{{ t('favorites.count', { n: fav.count, max: MAX }) }}</span></p>
      <p class="fm-sr" role="status" aria-live="polite">{{ announce }}</p>

      <ul class="fm-list" role="list">
        <li class="fm-row fm-locked"><Navigation :size="18" aria-hidden="true" /><span class="fm-name">{{ t('favorites.here') }}</span><Lock :size="16" aria-hidden="true" /><span class="fm-lock-tx">{{ t('favorites.lockedHere') }}</span></li>
        <li v-for="(p, i) in draft" :key="p.id" class="fm-row" :class="{ 'is-drag': dragId === p.id }" :data-id="p.id">
          <span class="fm-handle" role="img" :aria-label="t('favorites.dragHandle', { name: p.name })" @pointerdown="startDrag($event, p.id)" @pointermove="onDrag" @pointerup="endDrag" @pointercancel="endDrag"><GripVertical :size="20" aria-hidden="true" /></span>
          <span class="fm-name">{{ p.name }}</span>
          <button type="button" class="fm-btn" data-act="up" :disabled="i === 0 || busy" :aria-label="t('favorites.moveUp', { name: p.name })" @click="step(p.id, -1)"><ChevronUp :size="20" aria-hidden="true" /></button>
          <button type="button" class="fm-btn" data-act="down" :disabled="i === draft.length - 1 || busy" :aria-label="t('favorites.moveDown', { name: p.name })" @click="step(p.id, 1)"><ChevronDown :size="20" aria-hidden="true" /></button>
          <button type="button" class="fm-btn fm-del" :disabled="busy" :aria-label="t('favorites.remove', { name: p.name })" @click="remove(p.id)"><Trash2 :size="20" aria-hidden="true" /></button>
        </li>
      </ul>
      <p v-if="!draft.length" class="fm-hint">{{ t('favorites.manageEmpty') }}</p>
      <button type="button" class="fl-btn1 m-press fm-done" @click="$emit('update:modelValue', false)">{{ t('favorites.close') }}</button>
    </div>
  </BottomSheet>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Navigation, Lock, GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-vue-next'
import BottomSheet from '../motion/BottomSheet.vue'
import { useFavoritesStore } from '../../stores/favorites.js'
import { useFavoriteActions } from '../../composables/useFavoriteActions.js'
import { MAX_FAVORITES as MAX, moveFavorite } from '../../utils/favorites.js'

defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])
const { t } = useI18n()
const fav = useFavoritesStore()
const { report, removeWithUndo } = useFavoriteActions()
const ROW_H = 56

const draft = ref([...fav.places])      // copia locale: durante il trascinamento si salva solo al rilascio
const busy = ref(false), announce = ref('')
watch(() => fav.places, v => { if (dragId.value == null) draft.value = [...v] }, { deep: true })

async function step(id, dir) {
  const from = draft.value.findIndex(p => p.id === id), to = from + dir
  if (to < 0 || to >= draft.value.length) return
  busy.value = true
  const s = await fav.move(from, to)
  busy.value = false
  if (!report(s)) { draft.value = [...fav.places]; return }
  announce.value = t('favorites.moved', { name: draft.value[to]?.name || '', pos: to + 1, total: draft.value.length })
  await nextTick()     // il focus resta sullo stesso pulsante anche se la riga si è spostata
  document.querySelector(`.fm-row[data-id="${id}"] [data-act="${dir < 0 ? 'up' : 'down'}"]:not(:disabled)`)?.focus()
    ?? document.querySelector(`.fm-row[data-id="${id}"] [data-act="${dir < 0 ? 'down' : 'up'}"]`)?.focus()
}
const remove = (id) => removeWithUndo(id)

// Trascinamento dalla maniglia: righe alte quanto ROW_H, si salva una volta al rilascio.
const dragId = ref(null)
let startY = 0, startIndex = 0
function startDrag(e, id) {
  if (busy.value) return
  e.preventDefault(); e.stopPropagation()
  dragId.value = id; startY = e.clientY; startIndex = draft.value.findIndex(p => p.id === id)
  e.currentTarget.setPointerCapture?.(e.pointerId)
}
function onDrag(e) {
  if (dragId.value == null) return
  const cur = draft.value.findIndex(p => p.id === dragId.value)
  const target = Math.min(draft.value.length - 1, Math.max(0, startIndex + Math.round((e.clientY - startY) / ROW_H)))
  if (target !== cur) draft.value = moveFavorite(draft.value, cur, target)
}
async function endDrag() {
  if (dragId.value == null) return
  const id = dragId.value; dragId.value = null
  const ids = draft.value.map(p => p.id)
  if (ids.join() === fav.places.map(p => p.id).join()) return
  const s = await fav.reorder(ids)
  if (!report(s)) { draft.value = [...fav.places]; return }
  announce.value = t('favorites.moved', { name: draft.value.find(p => p.id === id)?.name || '', pos: ids.indexOf(id) + 1, total: ids.length })
}
</script>

<style scoped>
.fm { display: grid; gap: 10px; }
.fm-title { font-family: var(--font-display); font-size: 1.25rem; margin: 4px 0 0; }
.fm-hint { margin: 0; font-size: .88rem; color: rgb(var(--color-muted)); }
.fm-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.fm-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
.fm-row { height: 56px; display: flex; align-items: center; gap: 4px; border-bottom: 1px solid rgb(var(--color-border-light)); }
.fm-row.is-drag { background: rgb(var(--color-surface-2)); border-radius: 12px; }
.fm-locked { color: rgb(var(--color-muted)); gap: 8px; }
.fm-lock-tx { font-size: .75rem; }
.fm-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; color: rgb(var(--color-foam)); }
.fm-locked .fm-name { flex: 0 1 auto; color: inherit; }
.fm-handle { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; color: rgb(var(--color-muted)); cursor: grab; touch-action: none; }
.fm-btn { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 12px; background: none; color: rgb(var(--color-foam)); cursor: pointer; }
.fm-btn:disabled { opacity: .35; cursor: not-allowed; }
.fm-btn:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.fm-del { color: rgb(var(--color-danger-text)); }
.fm-done { margin-top: 6px; }
</style>

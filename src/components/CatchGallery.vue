<template>
  <!-- Foto della cattura: galleria scorrevole (variant «hero» 210 px con metro e puntini, «strip» 150 px) e visualizzatore a schermo intero. -->
  <div v-if="items.length" class="cg" :class="variant">
    <RulerFrame :ruler="variant === 'hero'" class="cg-frame">
      <div ref="slider" class="cg-slider" @scroll.passive="onSlide">
        <button v-for="(m, i) in items" :key="m._id || m.url" type="button" class="cg-slide" :aria-label="t('catchGallery.open', { n: i + 1, total: items.length })" @click="open(i, $event.currentTarget)">
          <img v-if="m.type !== 'video'" :src="m.url" :alt="m.caption || ''" loading="lazy" draggable="false" />
          <span v-else class="cg-video"><Clapperboard :size="32" aria-hidden="true" /></span>
        </button>
      </div>
      <template #badge>
        <span class="cg-count fl-mono">{{ counter(slide) }}</span>
      </template>
    </RulerFrame>
    <div v-if="variant === 'hero' && items.length > 1" class="cg-dots" aria-hidden="true">
      <span v-for="(m, i) in items" :key="i" class="cg-dot" :class="{ on: i === slide }"></span>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="cg-fade">
      <div v-if="viewing" class="cg-viewer" role="dialog" aria-modal="true" :aria-label="t('catchGallery.viewer')" @keydown="onKey">
        <div class="cgv-top">
          <button ref="closeBtn" type="button" class="cgv-btn" :aria-label="t('common.close')" @click="close"><X :size="22" /></button>
          <span class="cgv-count fl-mono">{{ counter(vIndex) }}</span>
          <button v-if="canDelete" ref="trashBtn" type="button" class="cgv-btn danger" :aria-label="t('catchGallery.delete')" @click="askRemove"><Trash2 :size="20" /></button>
          <span v-else class="cgv-btn spacer"></span>
        </div>
        <div ref="vSlider" class="cgv-slider" @scroll.passive="onVSlide">
          <div v-for="(m, i) in items" :key="m._id || m.url" class="cgv-slide">
            <img v-if="m.type !== 'video'" :src="m.url" :alt="m.caption || ''" loading="lazy" />
            <video v-else :src="m.url" controls preload="metadata" playsinline></video>
          </div>
        </div>
        <div v-if="items.length > 1" class="cg-dots on-dark" aria-hidden="true">
          <span v-for="(m, i) in items" :key="i" class="cg-dot" :class="{ on: i === vIndex }"></span>
        </div>
        <div v-if="meta" class="cgv-meta">
          <strong v-if="meta.title">{{ meta.title }}</strong>
          <span v-if="meta.measures" class="fl-mono cgv-measures">{{ meta.measures }}</span>
          <span v-if="meta.when" class="cgv-when">{{ meta.when }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Trash2, Clapperboard } from 'lucide-vue-next'
import RulerFrame from './RulerFrame.vue'
import { visibleMedia, slideIndexAt } from '../utils/catchMedia.js'

const props = defineProps({
  media: { type: Array, default: () => [] },
  variant: { type: String, default: 'hero' }, // 'hero' | 'strip'
  canDelete: { type: Boolean, default: false },
  meta: { type: Object, default: null }       // { title, measures, when } mostrati sotto la foto a schermo intero
})
const emit = defineEmits(['remove'])
const { t } = useI18n()

const items = computed(() => visibleMedia(props.media))
const slider = ref(null), vSlider = ref(null), closeBtn = ref(null), trashBtn = ref(null)
const slide = ref(0)
const viewing = ref(false)
const vIndex = ref(0)
let returnEl = null

const counter = i => `${Math.min(i, items.value.length - 1) + 1}/${items.value.length} ${t('session.view.photoWord')}`
const onSlide = () => { const el = slider.value; if (el) slide.value = slideIndexAt(el.scrollLeft, el.firstElementChild?.clientWidth || el.clientWidth, items.value.length) }
const onVSlide = () => { const el = vSlider.value; if (el) vIndex.value = slideIndexAt(el.scrollLeft, el.clientWidth, items.value.length) }

// `trigger`: elemento a cui restituire il focus alla chiusura (miniatura o diapositiva).
async function open(i = 0, trigger = null) {
  if (!items.value.length) return
  returnEl = trigger || document.activeElement
  vIndex.value = Math.min(i, items.value.length - 1)
  viewing.value = true
  document.body.style.overflow = 'hidden'
  await nextTick()
  if (vSlider.value) vSlider.value.scrollLeft = vIndex.value * vSlider.value.clientWidth
  closeBtn.value?.focus()
}
function close() {
  if (!viewing.value) return
  viewing.value = false
  document.body.style.overflow = ''
  const el = returnEl; returnEl = null
  nextTick(() => { if (el?.isConnected) el.focus?.() })
}
function onKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); close(); return }
  if (e.key === 'Tab') { // il focus resta nel visualizzatore
    const btns = [closeBtn.value, trashBtn.value].filter(Boolean)
    const idx = btns.indexOf(document.activeElement)
    if (!btns.length) return
    e.preventDefault()
    btns[(idx + (e.shiftKey ? btns.length - 1 : 1)) % btns.length].focus()
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const el = vSlider.value
    if (el) el.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * el.clientWidth, behavior: 'smooth' })
  }
}
function askRemove() {
  const m = items.value[vIndex.value]
  if (m) emit('remove', m)
}

// Se la foto aperta viene eliminata: resta il visualizzatore sulla successiva, o si chiude se non ce ne sono più.
watch(() => items.value.length, n => {
  if (!n) close()
  else if (vIndex.value >= n) vIndex.value = n - 1
  if (slide.value >= n) slide.value = Math.max(0, n - 1)
})
onBeforeUnmount(() => { if (viewing.value) document.body.style.overflow = '' })

defineExpose({ open, close })
</script>

<style scoped>
.cg-frame { border-radius: 24px 24px 24px 8px; background: var(--surface-2); }
.cg.hero .cg-frame { height: 210px; }
.cg.strip .cg-frame { height: 150px; border-radius: 16px 16px 16px 6px; }
.cg-slider { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
.cg-slider::-webkit-scrollbar { display: none; }
.cg-slide { flex: 0 0 100%; scroll-snap-align: center; padding: 0; margin: 0; border: 0; background: none; cursor: pointer; position: relative; min-width: 0; display: block; }
.cg.strip .cg-slide { flex-basis: 78%; margin-right: 6px; }
.cg-slide:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: -3px; }
.cg-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cg-video { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: rgb(var(--color-ocean-text)); }
.cg-count { display: inline-block; padding: 3px 9px; border-radius: 12px; background: rgb(11 22 35 / .78); color: #f1f5f9; font-size: 12px; }
.cg.hero :deep(.ruler-badge) { left: auto; right: 12px; top: 12px; bottom: auto; }
.cg.strip :deep(.ruler-badge) { left: 10px; bottom: 10px; }

.cg-dots { display: flex; justify-content: center; gap: 5px; padding-top: 10px; }
.cg-dot { width: 6px; height: 6px; border-radius: 3px; background: var(--border-light); transition: background var(--motion-fast) var(--ease-standard), width var(--motion-fast) var(--ease-standard); }
.cg-dot.on { width: 18px; background: rgb(var(--color-ocean-text)); }
.cg-dots.on-dark { position: absolute; left: 0; right: 0; bottom: 96px; padding: 0; }
.cg-dots.on-dark .cg-dot { background: rgb(241 245 249 / .35); }
.cg-dots.on-dark .cg-dot.on { background: #38bdf8; }

.cg-viewer { position: fixed; inset: 0; z-index: 1000; background: #05090f; color: #f1f5f9; display: flex; flex-direction: column; }
.cgv-top { display: flex; align-items: center; justify-content: space-between; padding: calc(8px + env(safe-area-inset-top)) 8px 8px; }
.cgv-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 12px; background: none; color: inherit; cursor: pointer; padding: 0; }
.cgv-btn.danger { color: #fca5a5; }
.cgv-btn.spacer { cursor: default; }
.cgv-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.cgv-count { font-size: 14px; }
.cgv-slider { flex: 1; min-height: 0; display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior: contain; }
.cgv-slider::-webkit-scrollbar { display: none; }
.cgv-slide { flex: 0 0 100%; scroll-snap-align: center; display: flex; align-items: center; justify-content: center; min-width: 0; }
.cgv-slide img, .cgv-slide video { max-width: 100%; max-height: 100%; object-fit: contain; }
.cgv-meta { display: flex; flex-direction: column; gap: 2px; padding: 16px 16px calc(18px + env(safe-area-inset-bottom)); min-height: 76px; box-sizing: border-box; }
.cgv-meta strong { font-size: 18px; font-weight: 800; }
.cgv-measures { color: rgb(var(--color-sand-text)); font-size: 13px; }
.cgv-when { color: rgb(241 245 249 / .7); font-size: 13px; }

.cg-fade-enter-active { transition: opacity var(--motion-base) var(--ease-enter); }
.cg-fade-leave-active { transition: opacity var(--motion-fast) var(--ease-exit); }
.cg-fade-enter-from, .cg-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .cg-slider, .cgv-slider { scroll-behavior: auto; }
  .cg-dot { transition: none; }
}
</style>

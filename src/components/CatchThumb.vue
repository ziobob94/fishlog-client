<template>
  <!-- Miniatura della cattura: prima foto, numero di foto se più di una, segnaposto tratteggiato senza foto. -->
  <span class="catch-thumb" :class="{ empty: !cover, fluid }" :style="{ '--ct-size': size + 'px' }">
    <template v-if="cover">
      <img v-if="cover.type !== 'video'" :src="cover.url" :alt="cover.caption || ''" loading="lazy" draggable="false" />
      <span v-else class="ct-video"><Clapperboard :size="26" aria-hidden="true" /></span>
      <span v-if="count > 1" class="ct-count fl-mono"><Camera :size="12" aria-hidden="true" /> {{ count }}</span>
    </template>
    <Fish v-else :size="30" aria-hidden="true" />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { Camera, Clapperboard, Fish } from 'lucide-vue-next'
import { coverOf, visibleMedia } from '../utils/catchMedia.js'

const props = defineProps({
  media: { type: Array, default: () => [] },
  size: { type: Number, default: 72 },
  fluid: { type: Boolean, default: false } // riempie la cella (griglia di miniature)
})
const cover = computed(() => coverOf(props.media))
const count = computed(() => visibleMedia(props.media).length)
</script>

<style scoped>
.catch-thumb { position: relative; display: flex; align-items: center; justify-content: center; flex: none; overflow: hidden;
  width: var(--ct-size); height: var(--ct-size); border-radius: 16px 16px 16px 6px; box-sizing: border-box;
  background: var(--surface-2); color: rgb(var(--color-ocean-text) / .7); }
.catch-thumb.fluid { width: 100%; height: auto; aspect-ratio: 1; }
.catch-thumb.empty { background: transparent; border: 1px dashed var(--border-light); }
.catch-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ct-video { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.ct-count { position: absolute; right: 4px; bottom: 4px; display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 10px;
  background: rgb(11 22 35 / .78); color: #f1f5f9; font-size: 11px; line-height: 1.2; }
</style>

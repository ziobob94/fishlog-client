<template>
  <div class="grid" role="list">
    <RouterLink v-for="it in items" :key="it.id" :to="it.to" class="tile" role="listitem" :aria-label="it.label">
      <img v-if="it.url && !it.isVideo" :src="it.url" alt="" loading="lazy" />
      <video v-else-if="it.url" :src="it.url" muted preload="metadata" playsinline></video>
      <span v-else class="ph"><ImageIcon v-if="!it.text" :size="26" /><span v-else class="txt">{{ it.text }}</span></span>
      <span v-if="it.isVideo" class="badge fl-mono"><Play :size="12" fill="currentColor" /></span>
      <span v-else-if="it.multi" class="badge"><Layers :size="14" /></span>
    </RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Image as ImageIcon, Play, Layers } from 'lucide-vue-next'
defineProps({ items: { type: Array, default: () => [] } })
</script>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; }
.tile { position: relative; aspect-ratio: 1; background: linear-gradient(160deg, var(--surface-2), rgb(var(--color-sea-deep))); display: block; overflow: hidden; color: var(--text-muted); }
.tile img, .tile video { width: 100%; height: 100%; object-fit: cover; display: block; }
.ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 8px; }
.txt { font-size: 12px; line-height: 1.3; color: var(--foam); display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-align: center; }
.badge { position: absolute; top: 6px; right: 6px; color: #fff; display: flex; align-items: center; gap: 3px; font-size: 11px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
</style>

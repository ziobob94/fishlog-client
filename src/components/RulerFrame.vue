<template>
  <!-- Cornice a metro per le foto delle catture. Slot predefinito: immagine/video. Slot "badge": pillola con la misura. -->
  <div class="ruler-frame">
    <slot />
    <template v-if="ruler">
      <div class="ruler-shade"></div>
      <div class="ruler-ticks"></div>
      <div class="ruler-major"></div>
    </template>
    <div v-if="$slots.badge" class="ruler-badge" :class="{ 'no-ruler': !ruler }"><slot name="badge" /></div>
  </div>
</template>

<script setup>
// `ruler` = false con foto reali: il metro serve solo per i placeholder.
defineProps({ ruler: { type: Boolean, default: true } })
</script>

<style scoped>
.ruler-frame { position: relative; overflow: hidden; }
.ruler-shade { position: absolute; left: 0; right: 0; bottom: 0; height: 40px; pointer-events: none;
  background: linear-gradient(0deg, rgba(11,22,35,.7), rgba(11,22,35,0)); }
.ruler-ticks { position: absolute; left: 12px; right: 12px; bottom: 10px; height: 10px; pointer-events: none;
  background: repeating-linear-gradient(90deg, rgba(241,245,249,.85) 0 2px, transparent 2px 10px); }
.ruler-major { position: absolute; left: 12px; right: 12px; bottom: 10px; height: 18px; pointer-events: none;
  background: repeating-linear-gradient(90deg, rgb(var(--color-sand-text)) 0 2px, transparent 2px 50px); }
.ruler-badge { position: absolute; left: 12px; bottom: 40px; }
.ruler-badge.no-ruler { bottom: 12px; }
</style>

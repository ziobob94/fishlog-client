<template>
  <div class="wx-sc">
    <div v-if="$slots.axis" class="wx-sc-axis" aria-hidden="true"><slot name="axis" /></div>
    <div ref="box" class="wx-sc-box" role="region" tabindex="0" :aria-label="label">
      <div class="wx-sc-in" :style="{ width: `${width}px` }"><slot /></div>
    </div>
  </div>
</template>

<script setup>
// Contenitore scorrevole in orizzontale per i grafici lunghi: la larghezza segue il numero di ore, il dito (o le frecce da tastiera) scorre.
import { ref } from 'vue'
defineProps({ width: { type: Number, required: true }, label: { type: String, default: '' } })
const box = ref(null)
defineExpose({ box })
</script>

<style scoped>
.wx-sc { display: flex; align-items: stretch; }
.wx-sc-axis { flex: none; }
.wx-sc-box { flex: 1; min-width: 0; overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; padding-bottom: 6px; border-radius: 12px; }
.wx-sc-box:focus-visible { outline: 2px solid rgb(var(--color-ocean-text)); outline-offset: 2px; }
.wx-sc-in { min-width: 100%; }
</style>

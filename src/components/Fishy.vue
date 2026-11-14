<template>
  <!-- Fishy, la mascotte dell'assistente: pesciolino azzurro con accento ambra (branchia), stessa mano del Bobber.
       7 espressioni; `avatar` lo mette in un tondo (24/40/56 px). Decorativo: il significato sta nel testo accanto. -->
  <svg :width="size" :height="size" viewBox="0 0 120 120" aria-hidden="true" focusable="false" :class="{ 'fishy-blink': blink }" class="fishy">
    <circle v-if="avatar" cx="60" cy="60" r="58" fill="rgb(var(--color-sea-deep))" :stroke="ring" stroke-width="3" />
    <g :transform="avatar ? 'translate(60 62) scale(.78) translate(-60 -62)' : ''" :opacity="expression === 'offline' ? .75 : 1">
      <g class="ol" :stroke-width="outline">
        <path d="M30 62 8 44q8 18 0 36Z" :fill="body" />
        <path d="M46 40q14-20 30-2Z" :fill="fin" />
        <ellipse cx="62" cy="62" rx="36" ry="27" :fill="body" />
        <path d="M30 66q32 24 66 0-4 22-34 22T30 66Z" :fill="belly" stroke="none" />
      </g>
      <path d="M82 46q-8 16 0 32" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" />

      <!-- Occhi e bocca cambiano con l'espressione -->
      <g class="fishy-eyes">
        <template v-if="expression === 'happy'"><path d="M84 58q6-8 12 0" fill="none" stroke="#0b1d33" stroke-width="4" stroke-linecap="round" /></template>
        <template v-else-if="expression === 'offline'"><path d="M84 58h12" stroke="#0b1d33" stroke-width="4" stroke-linecap="round" /></template>
        <template v-else-if="expression === 'limit'">
          <circle cx="90" cy="58" r="8" fill="#fff" /><circle cx="91" cy="60" r="4" fill="#0b1d33" /><path d="M80 50h20v6H80Z" :fill="body" />
        </template>
        <template v-else-if="expression === 'confused'">
          <circle cx="90" cy="58" r="8" fill="#fff" /><circle cx="88" cy="56" r="4" fill="#0b1d33" />
          <circle cx="68" cy="54" r="5" fill="#fff" /><circle cx="67" cy="52" r="2.4" fill="#0b1d33" />
        </template>
        <template v-else-if="expression === 'think'">
          <circle cx="90" cy="58" r="8" fill="#fff" /><circle cx="92" cy="54" r="4" fill="#0b1d33" />
        </template>
        <template v-else-if="expression === 'listen'">
          <circle cx="90" cy="57" r="11" fill="#fff" /><circle cx="92" cy="58" r="6" fill="#0b1d33" /><circle cx="94" cy="55" r="2" fill="#fff" />
        </template>
        <template v-else>
          <circle cx="90" cy="58" r="8" fill="#fff" /><circle cx="92" cy="59" r="4.5" fill="#0b1d33" />
        </template>
      </g>
      <path v-if="expression === 'listen'" d="M98 76a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" fill="#0b1d33" />
      <path v-else-if="expression === 'happy'" d="M84 72q8 10 16 0" fill="none" stroke="#0b1d33" stroke-width="3.5" stroke-linecap="round" />
      <path v-else-if="expression === 'confused'" d="M84 76q4-5 8 0t8 0" fill="none" stroke="#0b1d33" stroke-width="3.5" stroke-linecap="round" />
      <path v-else-if="expression === 'limit'" d="M84 78q8-4 14 0" fill="none" stroke="#0b1d33" stroke-width="3.5" stroke-linecap="round" />
      <path v-else d="M86 74q5 4 10 0" fill="none" stroke="#0b1d33" stroke-width="3.5" stroke-linecap="round" />
    </g>

    <!-- Segni accessori (sempre con una forma, mai solo colore) -->
    <g v-if="expression === 'think'" fill="#7dd3fc"><circle cx="100" cy="30" r="3" /><circle cx="108" cy="20" r="4" /><circle cx="97" cy="12" r="5" /></g>
    <text v-else-if="expression === 'confused'" x="96" y="30" font-size="26" font-weight="800" fill="#fbbf24" font-family="Manrope, sans-serif">?</text>
    <text v-else-if="expression === 'offline'" x="92" y="34" font-size="22" font-weight="800" fill="#7dd3fc" font-family="Manrope, sans-serif">z</text>
    <path v-else-if="expression === 'happy'" d="M100 18v14M93 25h14" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
    <path v-else-if="expression === 'limit'" d="M98 28q4 6 0 12" fill="none" stroke="#7dd3fc" stroke-width="3.5" stroke-linecap="round" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  expression: { type: String, default: 'rest', validator: v => ['rest', 'listen', 'think', 'happy', 'confused', 'offline', 'limit'].includes(v) },
  size: { type: Number, default: 56 }, // 24 · 40 · 56 · 120
  avatar: { type: Boolean, default: false },
  blink: { type: Boolean, default: false }
})
const muted = computed(() => props.expression === 'offline' || props.expression === 'limit')
const body = computed(() => muted.value ? '#5b86a6' : '#0ea5e9')
const fin = computed(() => muted.value ? '#4a7090' : '#0369a1')
const belly = computed(() => muted.value ? '#a9c6da' : '#7dd3fc')
const ring = computed(() => props.expression === 'limit' ? '#f59e0b' : 'rgb(var(--color-ocean))')
// Contorno: solo nel tema chiaro (--fishy-outline è trasparente nello scuro). Più sottile a taglie piccole.
const outline = computed(() => props.size <= 40 ? 4 : 3)
</script>

<style scoped>
.ol { stroke: var(--fishy-outline); stroke-linejoin: round; }
</style>

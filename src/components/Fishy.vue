<template>
  <!-- Fishy, la mascotte dell'assistente, ridisegnata sul mockup (stessa geometria di FishyAnimated): pesce azzurro rivolto a sinistra
       con l'esca ambra sullo stelo grigio, pancia chiara, pinna chiara. 7 espressioni; `avatar` lo mette in un tondo (24/40/56 px).
       Decorativo: il significato sta nel testo accanto. -->
  <svg :width="size" :height="size" viewBox="0 0 120 120" aria-hidden="true" focusable="false" :class="['fishy', { 'fishy-blink': blink }]">
    <circle v-if="avatar" cx="60" cy="60" r="58" fill="rgb(var(--color-sea-deep))" :stroke="ring" stroke-width="3" />
    <circle v-if="expression === 'listen'" cx="51" cy="27" r="9" fill="#0b1d33" opacity=".55" />
    <g :opacity="expression === 'offline' ? .8 : 1">
      <!-- Esca: stelo grigio curvo + bulbo ambra -->
      <path d="M47 47C41 42 41 35 47 31" fill="none" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="51" cy="27" r="6" :fill="lure" /><circle cx="49.2" cy="25.3" r="1.5" fill="#fde68a" />
      <g class="ol" :stroke-width="outline">
        <path d="M86 62 109 52q-4 17 0 31Z" :fill="body" />
        <path d="M45 52Q58 28 78 52Z" :fill="body" />
        <ellipse cx="54" cy="69" rx="37" ry="26" :fill="body" />
        <path d="M20 74Q36 98 66 90 88 84 86 72 62 86 36 80Z" :fill="belly" stroke="none" />
      </g>
      <path d="M62 68q8 2 7 13-9-3-7-13Z" :fill="fin" />

      <!-- Occhio e bocca cambiano con l'espressione -->
      <g class="fishy-eyes">
        <path v-if="expression === 'happy'" d="M31 63q6-8 12 0" fill="none" stroke="#0b1d33" stroke-width="2.6" stroke-linecap="round" />
        <path v-else-if="expression === 'offline'" d="M31 64h12" fill="none" stroke="#0b1d33" stroke-width="2.6" stroke-linecap="round" />
        <template v-else-if="expression === 'limit'">
          <circle cx="40" cy="65" r="6.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle cx="40.8" cy="67" r="3.4" fill="#0b1d33" /><path d="M32 57h16v6H32Z" :fill="body" />
        </template>
        <template v-else-if="expression === 'listen'">
          <circle cx="38" cy="64" r="8.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle cx="39" cy="64.5" r="5" fill="#0b1d33" /><circle cx="40.5" cy="62" r="1.7" fill="#fff" />
        </template>
        <template v-else-if="expression === 'think'">
          <circle cx="40" cy="65" r="6.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle cx="40" cy="62.5" r="3.4" fill="#0b1d33" /><circle cx="41.5" cy="61" r="1.1" fill="#fff" />
        </template>
        <template v-else-if="expression === 'confused'">
          <circle cx="40" cy="65" r="6.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle cx="38" cy="63.5" r="3.4" fill="#0b1d33" />
          <circle cx="62" cy="58" r="4" fill="#fff" stroke="#0b1d33" stroke-width="1" /><circle cx="61" cy="57" r="2" fill="#0b1d33" />
        </template>
        <template v-else>
          <circle cx="40" cy="65" r="6.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle cx="40.8" cy="65.5" r="3.6" fill="#0b1d33" /><circle cx="42" cy="63.8" r="1.2" fill="#fff" />
        </template>
      </g>
      <circle v-if="expression === 'happy'" cx="40" cy="77" r="2.8" fill="#f59e0b" opacity=".8" />
      <path v-if="expression === 'happy'" d="M21 71q6 12 18 4" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
      <ellipse v-else-if="expression === 'listen'" cx="24" cy="74" rx="3.4" ry="2.2" fill="#0b1d33" />
      <path v-else-if="expression === 'think' || expression === 'offline'" d="M20 75h9" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
      <path v-else-if="expression === 'confused'" d="M20 76q3-4 6 0t6 0" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
      <path v-else-if="expression === 'limit'" d="M20 77q5-4 11 0" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
      <path v-else d="M20 73q3 5 9 3" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
    </g>

    <!-- Segni accessori (sempre con una forma, mai solo colore) -->
    <path v-if="expression === 'listen'" d="M60 20q5 7 0 15" fill="none" stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round" />
    <g v-else-if="expression === 'think'" fill="#f59e0b"><circle cx="66" cy="31" r="1.7" /><circle cx="76" cy="24" r="3" /><circle cx="88" cy="17" r="4.4" /></g>
    <g v-else-if="expression === 'happy'" fill="#f59e0b">
      <path d="M92 30l2.4 5.6 5.6 2.4-5.6 2.4L92 46l-2.4-5.6L84 38l5.6-2.4Z" /><path d="M104 46l1.4 3.2 3.2 1.4-3.2 1.4-1.4 3.2-1.4-3.2-3.2-1.4 3.2-1.4Z" />
    </g>
    <text v-else-if="expression === 'confused'" x="88" y="34" font-size="26" font-weight="800" fill="#fbbf24" font-family="Manrope, sans-serif">?</text>
    <text v-else-if="expression === 'offline'" x="84" y="34" font-size="22" font-weight="800" fill="#7dd3fc" font-family="Manrope, sans-serif">z</text>
    <path v-else-if="expression === 'limit'" d="M62 22q5 7 0 15" fill="none" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round" />
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
const fin = computed(() => muted.value ? '#a9c6da' : '#7dd3fc')
const belly = computed(() => muted.value ? '#dbe7f0' : '#f0f9ff')
const lure = computed(() => muted.value ? '#b8a27a' : '#f59e0b')
const ring = computed(() => props.expression === 'limit' ? '#f59e0b' : props.expression === 'happy' ? '#86efac' : 'rgb(var(--color-ocean))')
// Contorno: solo nel tema chiaro (--fishy-outline è trasparente nello scuro). Più sottile a taglie piccole.
const outline = computed(() => props.size <= 40 ? 4 : 3)
</script>

<style scoped>
.ol { stroke: var(--fishy-outline); stroke-linejoin: round; }
</style>

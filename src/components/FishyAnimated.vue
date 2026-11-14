<template>
  <!-- Fishy animato per il pulsante: 4 stati (idle · listen · think · ok), solo CSS/SVG. Tutto decorativo (aria-hidden):
       la bocca e le onde in ascolto sono un ritmo fisso, NON seguono né fingono un livello audio reale. -->
  <svg :width="size" :height="size" viewBox="0 0 120 120" aria-hidden="true" focusable="false" class="fa" :class="`fa-${state}`">
    <circle class="fa-halo" cx="60" cy="60" r="58" fill="none" stroke="rgb(var(--color-sand-text))" stroke-width="2.5" />
    <circle cx="60" cy="60" r="58" fill="rgb(var(--color-sea-deep))" stroke="rgb(var(--color-ocean))" stroke-width="3" />
    <g transform="translate(60 62) scale(.78) translate(-60 -62)">
      <g class="fa-float"><g class="fa-hop">
        <g class="fa-ol" :stroke-width="outline">
          <path class="fa-tail" d="M30 62 8 44q8 18 0 36Z" fill="#0ea5e9" />
          <path d="M46 40q14-20 30-2Z" fill="#0369a1" />
          <ellipse cx="62" cy="62" rx="36" ry="27" fill="#0ea5e9" />
          <path d="M30 66q32 24 66 0-4 22-34 22T30 66Z" fill="#7dd3fc" stroke="none" />
        </g>
        <path d="M82 46q-8 16 0 32" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" />
        <g class="fa-eyes">
          <template v-if="state === 'ok'"><path d="M84 58q6-8 12 0" fill="none" stroke="#0b1d33" stroke-width="4" stroke-linecap="round" /></template>
          <template v-else-if="state === 'listen'">
            <circle cx="90" cy="57" r="11" fill="#fff" /><circle cx="92" cy="58" r="6" fill="#0b1d33" /><circle cx="94" cy="55" r="2" fill="#fff" />
          </template>
          <template v-else-if="state === 'think'">
            <circle cx="90" cy="58" r="8" fill="#fff" /><circle class="fa-pupil" cx="90" cy="58" r="4" fill="#0b1d33" />
          </template>
          <template v-else><circle cx="90" cy="58" r="8" fill="#fff" /><circle cx="92" cy="59" r="4.5" fill="#0b1d33" /></template>
        </g>
        <path v-if="state === 'listen'" class="fa-mouth" d="M98 76a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" fill="#0b1d33" />
        <path v-else-if="state === 'ok'" d="M84 72q8 10 16 0" fill="none" stroke="#0b1d33" stroke-width="3.5" stroke-linecap="round" />
        <path v-else d="M86 74q5 4 10 0" fill="none" stroke="#0b1d33" stroke-width="3.5" stroke-linecap="round" />
      </g></g>
    </g>
    <!-- Segni accessori: sempre una forma, mai solo colore -->
    <g v-if="state === 'listen'" class="fa-waves" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round">
      <path d="M104 60q5 6 0 12" /><path d="M110 55q9 11 0 22" />
    </g>
    <g v-else-if="state === 'think'" fill="#7dd3fc"><circle class="fa-dot" cx="100" cy="30" r="3" /><circle class="fa-dot" cx="108" cy="20" r="4" /><circle class="fa-dot" cx="97" cy="12" r="5" /></g>
    <g v-else-if="state === 'ok'" class="fa-sparks" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M100 14v14M93 21h14" /><path d="M24 26v8M20 30h8" />
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: { type: String, default: 'idle', validator: v => ['idle', 'listen', 'think', 'ok'].includes(v) },
  size: { type: Number, default: 56 }
})
// Contorno solo nel tema chiaro (--fishy-outline è trasparente nello scuro); più sottile a taglie piccole.
const outline = computed(() => props.size <= 40 ? 4 : 3)
</script>

<style>
/* Durate: riposo — ammicco 5 s, coda 2,8 s, galleggiamento 4 s · ascolto — bocca .9 s, onde/alone 1,2 s, coda .55 s ·
   elaborazione — sguardo 2,4 s, puntini 1,2 s sfasati di .2 s · successo — saltello .7 s, scintille .4 s. */
.fa { overflow: visible; }
.fa-ol { stroke: var(--fishy-outline); stroke-linejoin: round; }
.fa-float, .fa-hop, .fa-eyes, .fa-tail, .fa-mouth, .fa-pupil, .fa-sparks, .fa-waves, .fa-halo { transform-box: fill-box; transform-origin: center; }
.fa-tail { transform-origin: 100% 50%; }
.fa-float { animation: fa-float 4s ease-in-out infinite; }
.fa-eyes { animation: fa-blink 5s ease-in-out infinite; }
.fa-tail { animation: fa-tail 2.8s ease-in-out infinite; }
.fa-halo, .fa-waves { opacity: 0; }

.fa-listen .fa-tail { animation-duration: .55s; }
.fa-listen .fa-mouth { animation: fa-mouth .9s ease-in-out infinite; }
.fa-listen .fa-waves { animation: fa-waves 1.2s ease-out infinite; }
.fa-listen .fa-halo { animation: fa-halo 1.2s ease-out infinite; }

.fa-think .fa-pupil { animation: fa-gaze 2.4s ease-in-out infinite; }
.fa-dot { animation: fa-dot 1.2s ease-in-out infinite; }
.fa-dot:nth-child(2) { animation-delay: .2s; }
.fa-dot:nth-child(3) { animation-delay: .4s; }

.fa-ok .fa-float { animation: none; }
.fa-ok .fa-eyes { animation: none; }
.fa-ok .fa-hop { animation: fa-hop .7s ease-out 1; }
.fa-ok .fa-sparks { animation: fa-spark .4s ease-out 1; }

@keyframes fa-float { 50% { transform: translateY(-3px); } }
@keyframes fa-blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
@keyframes fa-tail { 50% { transform: rotate(10deg); } }
@keyframes fa-mouth { 50% { transform: scale(.55); } }
@keyframes fa-waves { 0% { opacity: .8; transform: translateX(-3px); } 100% { opacity: 0; transform: translateX(4px); } }
@keyframes fa-halo { 0% { opacity: .55; transform: scale(1); } 100% { opacity: 0; transform: scale(1.25); } }
@keyframes fa-gaze { 0%, 100% { transform: translate(0, -2px); } 50% { transform: translate(-3px, -3px); } }
@keyframes fa-dot { 0%, 100% { opacity: .25; } 40% { opacity: 1; } }
@keyframes fa-hop { 30% { transform: translateY(-8px); } 60% { transform: translateY(0); } 80% { transform: translateY(-2px); } }
@keyframes fa-spark { 0% { opacity: 0; transform: scale(.4); } 100% { opacity: 1; transform: scale(1); } }

/* Movimento ridotto: nessuna animazione, resta l'avatar fermo (onde e alone nascosti; scintille e puntini restano ferme). */
@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion='full']) .fa * { animation: none !important; }
}
:root[data-motion='reduce'] .fa * { animation: none !important; }
</style>

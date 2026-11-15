<template>
  <!-- Fishy animato per il pulsante: 5 stati (idle · listen · think · ok · hello), solo CSS/SVG. Tutto decorativo (aria-hidden):
       l'arco e l'alone in ascolto sono un ritmo fisso, NON seguono né fingono un livello audio reale. -->
  <svg :width="size" :height="size" viewBox="0 0 120 120" aria-hidden="true" focusable="false" class="fa" :class="`fa-${state}`">
    <circle class="fa-halo" cx="60" cy="60" r="58" fill="none" stroke="rgb(var(--color-sand-text))" stroke-width="2.5" />
    <circle cx="60" cy="60" r="58" fill="rgb(var(--color-sea-deep))" :stroke="state === 'ok' ? '#86efac' : 'rgb(var(--color-ocean))'" stroke-width="3" />
    <!-- Alone dell'esca (solo ascolto) -->
    <circle v-if="state === 'listen'" class="fa-glow" cx="51" cy="27" r="9" fill="#0b1d33" opacity=".55" />
    <g class="fa-float"><g class="fa-hop">
      <!-- Esca: stelo grigio curvo + bulbo arancione -->
      <path class="fa-lure" d="M47 47C41 42 41 35 47 31" fill="none" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round" />
      <circle class="fa-lure" cx="51" cy="27" r="6" fill="#f59e0b" /><circle cx="49.2" cy="25.3" r="1.5" fill="#fde68a" />
      <g class="fa-ol" :stroke-width="outline">
        <path class="fa-tail" d="M86 62 109 52q-4 17 0 31Z" fill="#0ea5e9" />
        <path d="M45 52Q58 28 78 52Z" fill="#0ea5e9" />
        <ellipse cx="54" cy="69" rx="37" ry="26" fill="#0ea5e9" />
        <path d="M20 74Q36 98 66 90 88 84 86 72 62 86 36 80Z" fill="#f0f9ff" stroke="none" />
      </g>
      <path d="M62 68q8 2 7 13-9-3-7-13Z" fill="#7dd3fc" />
      <g class="fa-eyes">
        <template v-if="state === 'ok'"><path d="M31 63q6-8 12 0" fill="none" stroke="#0b1d33" stroke-width="2.6" stroke-linecap="round" /></template>
        <template v-else-if="state === 'listen'">
          <circle cx="38" cy="64" r="8.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle cx="39" cy="64.5" r="5" fill="#0b1d33" /><circle cx="40.5" cy="62" r="1.7" fill="#fff" />
        </template>
        <template v-else-if="state === 'think'">
          <circle cx="40" cy="65" r="6.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle class="fa-pupil" cx="40" cy="65" r="3.4" fill="#0b1d33" /><circle cx="41.5" cy="63.5" r="1.1" fill="#fff" />
        </template>
        <template v-else>
          <circle cx="40" cy="65" r="6.5" fill="#fff" stroke="#0b1d33" stroke-width="1.2" /><circle cx="40.8" cy="65.5" r="3.6" fill="#0b1d33" /><circle cx="42" cy="63.8" r="1.2" fill="#fff" />
        </template>
      </g>
      <circle v-if="state === 'ok'" cx="40" cy="77" r="2.8" fill="#f59e0b" opacity=".8" />
      <path v-if="state === 'ok'" class="fa-mouth" d="M21 71q6 12 18 4" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
      <ellipse v-else-if="state === 'listen'" class="fa-mouth" cx="24" cy="74" rx="3.4" ry="2.2" fill="#0b1d33" />
      <path v-else-if="state === 'think'" d="M20 75h9" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
      <path v-else-if="state === 'hello'" class="fa-mouth" d="M20 71q5 9 13 3" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
      <path v-else d="M20 73q3 5 9 3" fill="none" stroke="#0b1d33" stroke-width="2.2" stroke-linecap="round" />
    </g></g>
    <!-- Segni accessori: sempre una forma, mai solo colore -->
    <path v-if="state === 'listen'" class="fa-waves" d="M60 20q5 7 0 15" fill="none" stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round" />
    <g v-else-if="state === 'think'" fill="#f59e0b"><circle class="fa-dot" cx="66" cy="31" r="1.7" /><circle class="fa-dot" cx="76" cy="24" r="3" /><circle class="fa-dot" cx="88" cy="17" r="4.4" /></g>
    <!-- Saluto: due archi accanto alla coda, una sola volta -->
    <g v-else-if="state === 'hello'" class="fa-hi" fill="none" stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round"><path d="M96 28q7 7 0 15" /><path d="M104 22q11 13 0 27" /></g>
    <g v-if="state === 'ok'" class="fa-sparks" fill="#f59e0b">
      <path d="M92 30l2.4 5.6 5.6 2.4-5.6 2.4L92 46l-2.4-5.6L84 38l5.6-2.4Z" /><path d="M104 46l1.4 3.2 3.2 1.4-3.2 1.4-1.4 3.2-1.4-3.2-3.2-1.4 3.2-1.4Z" />
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: { type: String, default: 'idle', validator: v => ['idle', 'listen', 'think', 'ok', 'hello'].includes(v) },
  size: { type: Number, default: 56 }
})
// Contorno solo nel tema chiaro (--fishy-outline è trasparente nello scuro); più sottile a taglie piccole.
const outline = computed(() => props.size <= 40 ? 4 : 3)
</script>

<style>
/* Durate: riposo — ammicco 5 s, coda 2,8 s, galleggiamento 4 s · ascolto — bocca .9 s, arco/alone 1,2 s, coda .55 s ·
   elaborazione — sguardo 2,4 s, puntini 1,2 s sfasati di .2 s · successo — saltello .7 s, scintille .4 s · saluto — saltello .7 s, archi 1,2 s, coda .5 s (una volta sola). */
.fa { overflow: visible; }
.fa-ol { stroke: var(--fishy-outline); stroke-linejoin: round; }
.fa-float, .fa-hop, .fa-lure, .fa-eyes, .fa-tail, .fa-mouth, .fa-sparks, .fa-glow, .fa-pupil, .fa-waves, .fa-halo, .fa-hi { transform-box: fill-box; transform-origin: center; }
.fa-tail { transform-origin: 100% 50%; }
.fa-float { animation: fa-float 4s ease-in-out infinite; }
.fa-eyes { animation: fa-blink 5s ease-in-out infinite; }
.fa-tail { animation: fa-tail 2.8s ease-in-out infinite; }
.fa-halo, .fa-waves { opacity: 0; }
.fa-lure { transform-origin: 47px 47px; animation: fa-lure 3.2s ease-in-out infinite; }

.fa-listen .fa-tail { animation-duration: .55s; }
.fa-listen .fa-mouth { animation: fa-mouth .9s ease-in-out infinite; }
.fa-listen .fa-glow { animation: fa-glow 1.2s ease-in-out infinite; }
.fa-listen .fa-waves { animation: fa-waves 1.2s ease-out infinite; }
.fa-listen .fa-halo { animation: fa-halo 1.2s ease-out infinite; }

.fa-think .fa-pupil { animation: fa-gaze 2.4s ease-in-out infinite; }
.fa-dot { animation: fa-dot 1.2s ease-in-out infinite; }
.fa-dot:nth-child(2) { animation-delay: .2s; }
.fa-dot:nth-child(3) { animation-delay: .4s; }

.fa-hello .fa-tail { animation-duration: .5s; }
.fa-hello .fa-hop { animation: fa-hop .7s ease-out 1; }
.fa-hello .fa-hi { animation: fa-hi 1.2s ease-out 1 both; }
.fa-ok .fa-float { animation: none; }
.fa-ok .fa-eyes { animation: none; }
.fa-ok .fa-sparks { animation: fa-spark .4s ease-out 1; }
.fa-ok .fa-hop { animation: fa-hop .7s ease-out 1; }

@keyframes fa-hi { 0% { opacity: 0; transform: translateX(-4px); } 30%, 70% { opacity: 1; } 100% { opacity: 0; transform: translateX(3px); } }
@keyframes fa-lure { 50% { transform: rotate(5deg); } }
@keyframes fa-mouth { 50% { transform: scale(.55); } }
@keyframes fa-glow { 50% { opacity: .2; } }
@keyframes fa-spark { 0% { opacity: 0; transform: scale(.4); } 100% { opacity: 1; transform: scale(1); } }
@keyframes fa-float { 50% { transform: translateY(-8px); } }
@keyframes fa-blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
@keyframes fa-tail { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
@keyframes fa-waves { 0% { opacity: .8; transform: translateX(-3px); } 100% { opacity: 0; transform: translateX(4px); } }
@keyframes fa-halo { 0% { opacity: .55; transform: scale(1); } 100% { opacity: 0; transform: scale(1.25); } }
@keyframes fa-gaze { 0%, 100% { transform: translate(2px, -3px); } 50% { transform: translate(-4px, -4px); } }
@keyframes fa-dot { 0%, 100% { opacity: .25; } 40% { opacity: 1; } }
@keyframes fa-hop { 30% { transform: translateY(-12px); } 60% { transform: translateY(0); } 80% { transform: translateY(-3px); } }

/* Movimento ridotto: nessuna animazione, resta l'avatar fermo (onde e alone nascosti; scintille e puntini restano ferme). */
@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion='full']) .fa * { animation: none !important; }
}
:root[data-motion='reduce'] .fa * { animation: none !important; }
</style>

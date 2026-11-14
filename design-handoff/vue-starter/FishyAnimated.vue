<template>
  <!-- Fishy animato (pulsante e foglio). state: idle | listen | think | ok. Le animazioni sono decorative (aria-hidden) e
       si spengono con prefers-reduced-motion. L'onda di "listen" NON segue la voce: il browser non dà il livello audio. -->
  <svg :class="['fy', 's-' + state]" :width="size" :height="size" viewBox="0 -10 120 120" :role="title ? 'img' : undefined" :aria-label="title || undefined" :aria-hidden="title ? undefined : 'true'" style="overflow: visible; display: block; flex: none">
    <g v-if="state === 'idle'" class="a-all o-b"><path class="o-tail" d="M90 62C98 52 106 44 116 40 111 56 111 68 116 84 106 80 98 72 90 67Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 31C52 19 66 16 76 22 72 28 70 32 68 35Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 66C10 42 30 30 56 30 80 30 96 46 96 64 96 84 78 96 54 96 28 96 10 84 10 66Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5"/><path d="M14 74C28 90 62 94 92 74 88 88 72 96 54 96 32 96 18 88 14 74Z" fill="var(--color-foam)"/><path d="M58 62C68 62 74 70 72 80 64 78 56 72 58 62Z" fill="var(--color-ocean-text)" stroke="var(--fishy-outline, none)" stroke-width="2" stroke-linejoin="round"/><g class="a-eye"><circle cx="36" cy="58" r="9" fill="#fff" stroke="#0b1623" stroke-width="1.5"/><circle cx="36" cy="58" r="4.200" fill="#0b1623"/><circle cx="34.500" cy="56.200" r="1.400" fill="#fff"/></g><path d="M15 71 q6 5 12 0" fill="none" stroke="#0b1623" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><g class="o-lure"><path d="M42 32 C38 22 40 14 50 10" fill="none" stroke="var(--color-muted)" stroke-width="3" stroke-linecap="round"/><circle cx="51" cy="9" r="7.500" fill="var(--color-sand)" stroke="var(--fishy-outline, none)" stroke-width="2"/><circle cx="48.500" cy="6.500" r="2" fill="#fff" opacity=".8"/></g></g>
    <g v-if="state === 'listen'" class="a-all o-b"><path class="o-tail" d="M90 62C98 52 106 44 116 40 111 56 111 68 116 84 106 80 98 72 90 67Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 31C52 19 66 16 76 22 72 28 70 32 68 35Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 66C10 42 30 30 56 30 80 30 96 46 96 64 96 84 78 96 54 96 28 96 10 84 10 66Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5"/><path d="M14 74C28 90 62 94 92 74 88 88 72 96 54 96 32 96 18 88 14 74Z" fill="var(--color-foam)"/><path d="M58 62C68 62 74 70 72 80 64 78 56 72 58 62Z" fill="var(--color-ocean-text)" stroke="var(--fishy-outline, none)" stroke-width="2" stroke-linejoin="round"/><g class="a-eye"><circle cx="36" cy="58" r="11" fill="#fff" stroke="#0b1623" stroke-width="1.5"/><circle cx="35" cy="57" r="6" fill="#0b1623"/><circle cx="33" cy="54.500" r="1.800" fill="#fff"/></g><ellipse class="a-talk" cx="19" cy="73" rx="4.500" ry="6" fill="#0b1623"/><circle class="a-glow" cx="51" cy="9" r="11" fill="var(--color-sand)" opacity="0"/><g class="o-lure"><path d="M42 32 C38 22 40 14 50 10" fill="none" stroke="var(--color-muted)" stroke-width="3" stroke-linecap="round"/><circle cx="51" cy="9" r="7.500" fill="var(--color-sand)" stroke="var(--fishy-outline, none)" stroke-width="2"/><circle cx="48.500" cy="6.500" r="2" fill="#fff" opacity=".8"/></g><path class="a-ray" d="M62 2 q6 7 0 14" fill="none" stroke="var(--color-sand)" stroke-width="3" stroke-linecap="round"/><path class="a-ray r2" d="M69 -2 q9 11 0 20" fill="none" stroke="var(--color-sand)" stroke-width="3" stroke-linecap="round"/></g>
    <g v-if="state === 'think'" class="a-all o-b"><path class="o-tail" d="M90 62C98 52 106 44 116 40 111 56 111 68 116 84 106 80 98 72 90 67Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 31C52 19 66 16 76 22 72 28 70 32 68 35Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 66C10 42 30 30 56 30 80 30 96 46 96 64 96 84 78 96 54 96 28 96 10 84 10 66Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5"/><path d="M14 74C28 90 62 94 92 74 88 88 72 96 54 96 32 96 18 88 14 74Z" fill="var(--color-foam)"/><path d="M58 62C68 62 74 70 72 80 64 78 56 72 58 62Z" fill="var(--color-ocean-text)" stroke="var(--fishy-outline, none)" stroke-width="2" stroke-linejoin="round"/><circle cx="36" cy="58" r="9" fill="#fff" stroke="#0b1623" stroke-width="1.5"/><g class="a-look"><circle cx="38" cy="55" r="4.200" fill="#0b1623"/><circle cx="36.500" cy="53.500" r="1.300" fill="#fff"/></g><path d="M15 72 h11" fill="none" stroke="#0b1623" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><g class="o-lure"><path d="M42 32 C38 22 40 14 50 10" fill="none" stroke="var(--color-muted)" stroke-width="3" stroke-linecap="round"/><circle cx="51" cy="9" r="7.500" fill="var(--color-sand)" stroke="var(--fishy-outline, none)" stroke-width="2"/><circle cx="48.500" cy="6.500" r="2" fill="#fff" opacity=".8"/></g><circle class="a-dot" cx="66" cy="12" r="2.600" fill="var(--color-sand)"/><circle class="a-dot d2" cx="75" cy="4" r="3.600" fill="var(--color-sand)"/><circle class="a-dot d3" cx="88" cy="-3" r="5" fill="var(--color-sand)"/></g>
    <g v-if="state === 'ok'" class="a-all o-b"><path class="o-tail" d="M90 62C98 52 106 44 116 40 111 56 111 68 116 84 106 80 98 72 90 67Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 31C52 19 66 16 76 22 72 28 70 32 68 35Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 66C10 42 30 30 56 30 80 30 96 46 96 64 96 84 78 96 54 96 28 96 10 84 10 66Z" fill="var(--color-ocean)" stroke="var(--fishy-outline, none)" stroke-width="2.5"/><path d="M14 74C28 90 62 94 92 74 88 88 72 96 54 96 32 96 18 88 14 74Z" fill="var(--color-foam)"/><path d="M58 62C68 62 74 70 72 80 64 78 56 72 58 62Z" fill="var(--color-ocean-text)" stroke="var(--fishy-outline, none)" stroke-width="2" stroke-linejoin="round"/><path d="M28 60 q8 -10 16 0" fill="none" stroke="#0b1623" stroke-width="3.2" stroke-linecap="round"/><path d="M13 68 q8 14 19 3" fill="none" stroke="#0b1623" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="35" cy="72" r="4" fill="var(--color-sand)" opacity=".55"/><g class="o-lure"><path d="M42 32 C38 22 40 14 50 10" fill="none" stroke="var(--color-muted)" stroke-width="3" stroke-linecap="round"/><circle cx="51" cy="9" r="7.500" fill="var(--color-sand)" stroke="var(--fishy-outline, none)" stroke-width="2"/><circle cx="48.500" cy="6.500" r="2" fill="#fff" opacity=".8"/></g><path class="a-spark" d="M80 18 l2.500 6 6 2.500 -6 2.500 -2.500 6 -2.500 -6 -6 -2.500 6 -2.500Z" fill="var(--color-sand)"/><path class="a-spark s2" d="M98 40 l1.700 4 4 1.700 -4 1.700 -1.700 4 -1.700 -4 -4 -1.700 4 -1.700Z" fill="var(--color-sand)"/></g>
  </svg>
</template>

<script setup>
defineProps({
  state: { type: String, default: 'idle' },
  size: { type: Number, default: 56 },
  title: { type: String, default: '' },
})
</script>

<style>
/* Non scoped di proposito: le classi sono nei <g> interni; prefisso .fy per non collidere. */
:root { --fishy-outline: none; }
[data-theme='light'] { --fishy-outline: #334155; }

.fy *{transform-box:fill-box}
.fy .o-tail{transform-origin:0% 50%}.fy .o-lure{transform-origin:50% 100%}.fy .o-b{transform-origin:50% 50%}
@keyframes fy-wag{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}}
@keyframes fy-wagf{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(11deg)}}
@keyframes fy-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
@keyframes fy-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}
@keyframes fy-talk{0%,100%{transform:scaleY(.22)}18%{transform:scaleY(1)}38%{transform:scaleY(.45)}58%{transform:scaleY(.95)}78%{transform:scaleY(.3)}}
@keyframes fy-ray{0%{opacity:0}30%,70%{opacity:1}100%{opacity:0}}
@keyframes fy-glow{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.4;transform:scale(1.35)}}
@keyframes fy-dot{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes fy-look{0%,100%{transform:translate(0,0)}25%{transform:translate(3px,-3px)}50%{transform:translate(-2px,-3px)}75%{transform:translate(2px,1px)}}
@keyframes fy-hop{0%{transform:translateY(0)}35%{transform:translateY(-7px)}65%{transform:translateY(0)}80%{transform:translateY(-2px)}100%{transform:translateY(0)}}
@keyframes fy-pop{0%{transform:scale(0);opacity:0}55%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:1}}
.fy.s-idle  .o-tail{animation:fy-wag 2.8s ease-in-out infinite}
.fy.s-idle  .a-eye{animation:fy-blink 5s ease-in-out infinite}
.fy.s-idle  .o-lure{animation:fy-sway 4s ease-in-out infinite}
.fy.s-listen  .o-tail{animation:fy-wagf .55s ease-in-out infinite}
.fy.s-listen  .a-talk{animation:fy-talk .9s ease-in-out infinite}
.fy.s-listen  .a-ray{animation:fy-ray 1.2s ease-in-out infinite}
.fy.s-listen  .a-ray.r2{animation-delay:.25s}
.fy.s-listen  .a-glow{animation:fy-glow 1.2s ease-in-out infinite}
.fy.s-listen  .o-lure{animation:fy-sway 1.6s ease-in-out infinite}
.fy.s-think  .a-look{animation:fy-look 2.4s ease-in-out infinite}
.fy.s-think  .a-dot{animation:fy-dot 1.2s ease-in-out infinite}
.fy.s-think  .a-dot.d2{animation-delay:.2s}.fy.s-think  .a-dot.d3{animation-delay:.4s}
.fy.s-think  .o-tail{animation:fy-wag 1.6s ease-in-out infinite}
.fy.s-ok  .a-all{animation:fy-hop .7s ease-out 1 both}
.fy.s-ok  .a-spark{animation:fy-pop .4s ease-out .15s 1 both}
.fy.s-ok  .a-spark.s2{animation-delay:.3s}
.fy.s-ok  .o-tail{animation:fy-wagf .5s ease-in-out 3}
@media (prefers-reduced-motion:reduce){.fy *{animation:none!important}.fy .a-spark{opacity:1}.fy .a-ray{opacity:1}.fy .a-dot{opacity:1}}

</style>

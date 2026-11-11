<template>
  <!-- Pull to refresh con il galleggiante. Trascinando, il contenuto scende con resistenza 0,5 (max 72 px, solo transform);
       oltre 64 px il rilascio avvia l'aggiornamento: il galleggiante «tuffa» (ciclo 2,6 s) finché `refreshing` è true,
       poi il contenuto risale in 200 ms. Con movimento ridotto non si trascina: compare una riga fissa con lo spinner (dissolvenza). -->
  <div ref="root" class="ptr" @touchstart.passive="start" @touchmove="move" @touchend="end" @touchcancel="end">
    <div class="ptr-ind" :style="{ opacity: reduced ? (refreshing ? 1 : 0) : Math.min(1, pull / 48) }" role="status" :aria-label="refreshing ? 'Aggiorno…' : ''">
      <Bobber :size="40" :class="{ 'm-bobber': refreshing }" />
    </div>
    <div class="ptr-body" :style="bodyStyle"><slot /></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Bobber from '../Bobber.vue'
import { useReducedMotion } from './motion.js'

const props = defineProps({ refreshing: Boolean })
const emit = defineEmits(['refresh'])
const reduced = useReducedMotion()
const root = ref(null), pull = ref(0), dragging = ref(false)
let y0 = 0
const MAX = 72, THRESHOLD = 64

const bodyStyle = computed(() => {
  if (reduced.value) return undefined
  const y = props.refreshing ? 48 : pull.value
  if (!y && !dragging.value) return undefined   // a riposo nessun transform: non crea un contesto per i position:fixed interni
  return { transform: `translateY(${y}px)`, transition: dragging.value ? 'none' : 'transform var(--motion-base) var(--ease-standard)' }
})
const atTop = () => (root.value?.closest('[data-scroll]') || document.scrollingElement).scrollTop <= 0
function start(e) { if (atTop() && !props.refreshing) { y0 = e.touches[0].clientY; dragging.value = true } else dragging.value = false }
function move(e) {
  if (!dragging.value || reduced.value) return
  const dy = e.touches[0].clientY - y0
  if (dy <= 0) { pull.value = 0; return }
  e.preventDefault()
  pull.value = Math.min(MAX, dy * 0.5)
}
function end() {
  if (!dragging.value) return
  dragging.value = false
  if (pull.value >= THRESHOLD * 0.5 + 0.5 && pull.value >= 32) emit('refresh')
  pull.value = 0
}
</script>

<style scoped>
.ptr { position: relative; }
.ptr-ind { position: absolute; top: 0; left: 0; right: 0; height: 56px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
</style>

<template>
  <!-- Comparsa leggera delle righe al primo caricamento: ogni riga sale di 8 px e sfuma in 200 ms, con 40 ms di ritardo
       per riga (massimo 6 righe, poi tutte insieme). Non si rianima negli aggiornamenti né nello scroll infinito. -->
  <component :is="tag" ref="root" :class="{ stagger: first }">
    <slot />
  </component>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
defineProps({ tag: { type: String, default: 'div' } })
const first = ref(true)
const root = ref(null)
let t, mo
// le righe leggono --i dal proprio indice: usare <li v-for="(x, i) in rows" :style="{ '--i': i }">
// La finestra di comparsa parte quando compare la PRIMA riga, non al montaggio: se i dati arrivano dopo
// (rete lenta, iPhone in risparmio energetico) l'animazione non va persa.
function arm() {
  mo?.disconnect(); mo = null
  clearTimeout(t)
  t = setTimeout(() => { first.value = false }, 200 + 6 * 40 + 150)
}
onMounted(() => {
  const el = root.value
  if (el && el.children.length) return arm()
  if (el && typeof MutationObserver !== 'undefined') {
    mo = new MutationObserver(() => { if (el.children.length) arm() })
    mo.observe(el, { childList: true })
  } else arm()
})
onBeforeUnmount(() => { clearTimeout(t); mo?.disconnect() })
</script>

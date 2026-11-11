<template>
  <!-- Comparsa leggera delle righe al primo caricamento: ogni riga sale di 8 px e sfuma in 200 ms, con 40 ms di ritardo
       per riga (massimo 6 righe, poi tutte insieme). Non si rianima negli aggiornamenti né nello scroll infinito. -->
  <component :is="tag" :class="{ stagger: first }">
    <slot />
  </component>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, useSlots, watch } from 'vue'
defineProps({ tag: { type: String, default: 'div' } })
const first = ref(true)
let t
// le righe leggono --i dal proprio indice: usare <li v-for="(x, i) in rows" :style="{ '--i': i }">
onMounted(() => { t = setTimeout(() => { first.value = false }, 200 + 6 * 40 + 50) })
onBeforeUnmount(() => clearTimeout(t))
</script>

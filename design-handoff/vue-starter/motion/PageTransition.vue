<template>
  <!-- Cambio pagina. Avanti: la nuova entra da destra di 24 px con dissolvenza (320 ms, --ease-enter), la vecchia sfuma (200 ms, --ease-exit).
       Indietro: inverso. Tra tab della barra: solo dissolvenza incrociata (200 ms). Con movimento ridotto restano solo le dissolvenze da 120 ms.
       Ogni pagina deve avere un solo elemento radice. Le pagine in uscita diventano absolute: nessun salto di layout.
       Uso in App.vue: <PageTransition /> al posto di <router-view />.
       Nelle route: meta: { tab: true } per le 4 voci della barra; meta: { depth: 1 } per i dettagli, { depth: 2 } per le sotto-pagine. -->
  <router-view v-slot="{ Component, route }">
    <div class="page-stack">
      <Transition :name="name">
        <component :is="Component" :key="route.meta.tab ? route.name : route.fullPath" class="page" />
      </Transition>
    </div>
  </router-view>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const name = ref('page-forward')
let popped = false
window.addEventListener('popstate', () => { popped = true })   // tasto indietro del browser o gesto

router.beforeEach((to, from) => {
  const depth = (r) => r.meta?.depth ?? 0
  if (to.meta?.tab && from.meta?.tab && to.name !== from.name) name.value = 'page-tab'
  else if (popped || depth(to) < depth(from)) name.value = 'page-back'
  else name.value = 'page-forward'
  popped = false
})
</script>

<style>
.page { position: relative; min-height: 100%; background: rgb(var(--color-ink)); }
html { scrollbar-gutter: stable; }   /* la comparsa della scrollbar non sposta la pagina */
</style>

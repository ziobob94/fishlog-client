<template>
  <!-- Cambio pagina. Avanti: la nuova entra da destra di 24 px con dissolvenza (320 ms, --ease-enter), la vecchia sfuma (200 ms, --ease-exit).
       Indietro: inverso. Tra tab della barra: solo dissolvenza incrociata (200 ms). Con movimento ridotto restano solo dissolvenze brevi.
       Ogni pagina è avvolta in un <div class="page">: le viste con più elementi radice funzionano comunque.
       Nelle route: meta.tab = true per le 4 voci della barra; meta.depth = 1 per i dettagli, 2 per le sotto-pagine. -->
  <RouterView v-slot="{ Component, route }">
    <div class="page-stack" :class="{ 'page-fill': route.meta.fullHeight }">
      <Transition :name="name">
        <div :key="route.meta.tab ? route.name : route.fullPath" class="page" :class="{ 'page-fill': route.meta.fullHeight }">
          <component :is="Component" />
        </div>
      </Transition>
    </div>
  </RouterView>
</template>

<script setup>
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()
const name = ref('page-tab')
let popped = false
window.addEventListener('popstate', () => { popped = true })   // tasto indietro del browser o gesto

router.beforeEach((to, from) => {
  const depth = (r) => r.meta?.depth ?? 0
  if (!from.name || (to.meta?.tab && from.meta?.tab)) name.value = 'page-tab'
  else if (popped || depth(to) < depth(from)) name.value = 'page-back'
  else name.value = 'page-forward'
  popped = false
})
</script>

<style>
.page { position: relative; min-height: 100%; }
/* Viste a tutta altezza (chat): la catena di altezze deve restare vincolata, così scorre solo la lista interna
   e non la pagina. Senza queste regole .page cresce col contenuto e la lista messaggi non è più il contenitore di scroll. */
.page-stack.page-fill { display: flex; flex-direction: column; flex: 1 1 0%; min-height: 0; }
.page.page-fill { display: flex; flex-direction: column; flex: 1 1 0%; min-height: 0; height: 100%; }
html { scrollbar-gutter: stable; }   /* la comparsa della scrollbar non sposta la pagina */
</style>

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

// Direzione «indietro» solo se popstate precede DAVVERO questa navigazione: il flag scade subito, altrimenti
// un popstate senza cambio di route (hash, stessa pagina) faceva animare «indietro» la navigazione successiva.
let popped = false, poppedTimer
window.addEventListener('popstate', () => {
  popped = true
  clearTimeout(poppedTimer)
  poppedTimer = setTimeout(() => { popped = false }, 400)
})

// Swipe dal bordo sinistro (gesto «indietro» di iOS Safari / PWA): il sistema anima già lo spostamento da sé,
// quindi la nostra scivolata si sommerebbe (doppia animazione, a scatti). In quel caso solo dissolvenza.
let edgeSwipe = false, edgeTimer
window.addEventListener('touchstart', (e) => {
  const x = e.touches?.[0]?.clientX ?? 999
  const w = window.innerWidth
  edgeSwipe = x < 24 || x > w - 24
  clearTimeout(edgeTimer)
  if (edgeSwipe) edgeTimer = setTimeout(() => { edgeSwipe = false }, 1500)
}, { passive: true })

router.beforeEach((to, from) => {
  const depth = (r) => r.meta?.depth ?? 0
  if (!from.name || (to.meta?.tab && from.meta?.tab) || (popped && edgeSwipe)) name.value = 'page-tab'
  else if (popped || depth(to) < depth(from)) name.value = 'page-back'
  else name.value = 'page-forward'
  popped = false; edgeSwipe = false
})
</script>

<style>
.page { position: relative; min-height: 100%; }
html { scrollbar-gutter: stable; }   /* la comparsa della scrollbar non sposta la pagina */
</style>

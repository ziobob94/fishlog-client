<template>
  <details class="mt-4 text-sm">
    <summary class="text-muted cursor-pointer">Diagnostica animazioni</summary>
    <ul class="mt-2 space-y-1 text-muted">
      <li v-for="r in rows" :key="r[0]"><b>{{ r[0] }}:</b> {{ r[1] }}</li>
    </ul>
    <div class="mt-3 h-4 relative rounded bg-surface-2 overflow-hidden" aria-hidden="true">
      <div ref="dot" class="absolute top-0 left-0 w-4 h-4 rounded-full bg-ocean" style="transition: transform 600ms linear"></div>
    </div>
    <button type="button" class="btn btn-secondary btn-sm mt-2" @click="runTest">Prova animazione</button>
    <p class="mt-1 text-muted">{{ result }}</p>
    <p class="mt-2 text-muted"><b>Frequenza di aggiornamento:</b> {{ fps }}</p>
  </details>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const rows = ref([])
const fps = ref('misurazione…')
const result = ref('Premi «Prova animazione»: il pallino deve scorrere a destra in 0,6 s.')
const dot = ref(null)
let on = false

function runTest() {
  const el = dot.value
  if (!el) return
  on = !on
  const w = el.parentElement.clientWidth - 16
  const t0 = performance.now()
  let fired = false
  const done = () => { fired = true; el.removeEventListener('transitionend', done); result.value = `Transizione CSS completata in ${Math.round(performance.now() - t0)} ms (attesi ~600).` }
  el.addEventListener('transitionend', done)
  el.style.transform = `translateX(${on ? w : 0}px)`
  setTimeout(() => { if (!fired) { el.removeEventListener('transitionend', done); result.value = 'La transizione CSS NON è partita (nessun transitionend dopo 1,5 s).' } }, 1500)
}

// ~60 (o 120) fps = normale; ~30 fps indica quasi sempre il «Risparmio energetico» di iOS, che dimezza il ritmo
// delle animazioni (sembrano a scatti o «a tratti») senza alcun segnale leggibile da Safari.
function measureFps() {
  let n = 0, t0 = 0
  const tick = (t) => {
    if (!t0) t0 = t
    n++
    if (t - t0 < 1000) return requestAnimationFrame(tick)
    const f = Math.round((n * 1000) / (t - t0))
    fps.value = f < 40 ? `${f} fps: probabile Risparmio energetico (o schermo a basso ritmo)` : `${f} fps: normale`
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  measureFps()
  const mm = (q) => { try { return window.matchMedia(q).matches } catch { return 'n/d' } }
  let stored = 'n/d'
  try { stored = localStorage.getItem('fishlog.motion') || 'auto (nessun valore)' } catch { stored = 'storage bloccato' }
  const root = document.documentElement
  const tok = getComputedStyle(root).getPropertyValue('--motion-slow').trim() || 'vuoto'
  rows.value = [
    ['Impostazione app (storage)', stored],
    ['data-motion sull\'html', root.getAttribute('data-motion') || 'assente'],
    ['Sistema: riduci movimento', String(mm('(prefers-reduced-motion: reduce)'))],
    ['--motion-slow', tok],
    ['App installata (standalone)', String(mm('(display-mode: standalone)') || navigator.standalone === true)],
    ['Web Animations', String(typeof Element !== 'undefined' && 'animate' in Element.prototype)],
    ['View Transitions', String(!!document.startViewTransition)],
    ['Risparmio energetico', 'non rilevabile da Safari: controllalo a mano'],
    ['Build', typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : 'n/d'],
    ['User agent', navigator.userAgent]
  ]
})
</script>

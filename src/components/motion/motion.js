// Utilità del sistema di movimento (vedi ../../tokens/motion.css). Nessuna dipendenza oltre a Vue.
import { ref, onMounted, onBeforeUnmount } from 'vue'

const KEY = 'fishlog.motion'                  // 'auto' | 'reduce' | 'full'

/** Da chiamare una volta in main.js: applica la scelta salvata (Impostazioni → «Riduci animazioni»). */
export function initMotion() {
  try {
    const pref = localStorage.getItem(KEY) || 'auto'
    setMotionPreference(pref, false)
  } catch { /* storage non disponibile: resta «auto» */ }
}

export function setMotionPreference(pref, save = true) {
  const root = document.documentElement
  if (pref === 'auto') root.removeAttribute('data-motion')
  else root.setAttribute('data-motion', pref)
  if (save) { try { localStorage.setItem(KEY, pref) } catch { /* ignora */ } }
}

/** true se l'utente ha chiesto meno movimento (sistema o app). Reattivo. */
export function useReducedMotion() {
  const reduced = ref(false)
  let mq
  const read = () => {
    const forced = document.documentElement.getAttribute('data-motion')
    reduced.value = forced === 'reduce' ? true : forced === 'full' ? false : !!mq?.matches
  }
  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    read()
    mq.addEventListener('change', read)
  })
  onBeforeUnmount(() => mq?.removeEventListener('change', read))
  return reduced
}

/** Legge una durata dai token, in millisecondi: ms('--motion-slow') → 320 (o 120 con movimento ridotto). */
export function ms(varName) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return v.endsWith('ms') ? parseFloat(v) : v.endsWith('s') ? parseFloat(v) * 1000 : 0
}

/**
 * Swipe verso il basso per chiudere (fogli, viewer storie).
 * - segue il dito con `transform` (nessun layout), sfuma lo sfondo;
 * - chiude se supera il 25 % dell'altezza o la velocità 0,5 px/ms; altrimenti torna su con la molla leggera.
 * Il contenuto scorrevole interno non deve essere trascinato: il gesto parte solo dalla maniglia/intestazione
 * oppure dal contenuto già a scrollTop = 0.
 */
export function useSwipeDismiss(el, { onDismiss, onProgress, scrollEl, closeScale = 1 } = {}) {
  const dragging = ref(false)
  let startY = 0, lastY = 0, lastT = 0, vy = 0, h = 1, active = false

  const down = (e) => {
    if (scrollEl?.value && scrollEl.value.contains(e.target) && scrollEl.value.scrollTop > 0) return
    active = true; startY = lastY = e.clientY; lastT = e.timeStamp; vy = 0
    h = el.value.getBoundingClientRect().height || 1
    el.value.setPointerCapture?.(e.pointerId)
  }
  const move = (e) => {
    if (!active) return
    const dy = Math.max(0, e.clientY - startY)
    if (dy > 4) dragging.value = true
    if (!dragging.value) return
    vy = (e.clientY - lastY) / Math.max(1, e.timeStamp - lastT); lastY = e.clientY; lastT = e.timeStamp
    const p = Math.min(1, dy / h)
    const s = 1 - (1 - closeScale) * p
    el.value.style.transform = `translateY(${dy}px) scale(${s})`
    onProgress?.(p)
  }
  const up = () => {
    if (!active) return
    active = false
    if (!dragging.value) return
    const dy = lastY - startY
    const close = dy > h * 0.25 || vy > 0.5
    dragging.value = false
    if (close) {
      // esce dallo schermo con la curva di uscita, poi avvisa il componente
      const node = el.value
      node.style.transition = `transform ${ms('--motion-base')}ms var(--ease-exit)`
      node.style.transform = `translateY(100%)`
      onProgress?.(1)
      setTimeout(() => { onDismiss?.() }, ms('--motion-base'))
    } else {
      const node = el.value
      node.style.transition = `transform ${ms('--motion-base')}ms var(--ease-spring)`
      node.style.transform = ''
      onProgress?.(0)
      setTimeout(() => { node.style.transition = '' }, ms('--motion-base'))
    }
  }
  return { dragging, handlers: { onPointerdown: down, onPointermove: move, onPointerup: up, onPointercancel: up } }
}

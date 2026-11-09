// Accessibilità dei form: molti campi hanno l'etichetta accanto (nello stesso
// contenitore) ma senza `for`/`id`, quindi per i lettori di schermo e per il
// tocco sull'etichetta non sono collegati. Questo osservatore li collega
// dopo ogni aggiornamento del DOM, anche nelle liste dinamiche (v-for), e
// dà un `aria-label` ai campi senza etichetta (es. le ricerche con placeholder).

const CONTROLS = 'input:not([type="hidden"]), select, textarea'
let counter = 0
let scheduled = false

function nextControl(label) {
  // Il campo è un fratello successivo dell'etichetta (anche dentro un wrapper)
  for (let el = label.nextElementSibling; el; el = el.nextElementSibling) {
    if (el.tagName === 'LABEL') return null // un'altra etichetta: niente da collegare
    if (el.matches?.(CONTROLS)) return el
    const inner = el.querySelector?.(CONTROLS)
    if (inner) return inner
  }
  return null
}

function link() {
  scheduled = false
  const root = document.getElementById('app')
  if (!root) return

  root.querySelectorAll('label:not([for])').forEach(label => {
    if (label.querySelector(CONTROLS)) return // etichetta che avvolge il campo
    const ctrl = nextControl(label)
    if (!ctrl || ctrl.labels?.length) return
    if (!ctrl.id) ctrl.id = `fl-field-${++counter}`
    label.htmlFor = ctrl.id
  })

  root.querySelectorAll(CONTROLS).forEach(ctrl => {
    if (ctrl.type === 'file' || ctrl.hidden || ctrl.classList.contains('hidden')) return
    if (ctrl.labels?.length || ctrl.getAttribute('aria-label') || ctrl.getAttribute('aria-labelledby')) return
    const hint = ctrl.getAttribute('placeholder') || ctrl.getAttribute('title')
    if (hint) ctrl.setAttribute('aria-label', hint)
  })
}

function schedule() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(link)
}

export function setupFormA11y() {
  const root = document.getElementById('app')
  if (!root) return
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true })
  schedule()
}

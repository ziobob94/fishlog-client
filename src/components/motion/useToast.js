// Toast: successo, errore, avviso, info. Uso: const toast = useToast(); toast.success('Cattura salvata')
// Durate: successo/info 4 s, avviso 6 s, errore 8 s (o fisso con { persist: true }). Si fermano con mouse/dito/tastiera.
import { reactive } from 'vue'

const state = reactive({ items: [] })
let n = 0
const LIFE = { success: 4000, info: 4000, warning: 6000, error: 8000 }

function push(kind, message, opts = {}) {
  const t = { id: ++n, kind, message, action: opts.action || null, position: opts.action ? 'bottom' : 'top', timer: null, left: opts.persist ? 0 : (opts.duration ?? LIFE[kind]) }
  state.items = [...state.items.slice(-2), t]            // massimo 3 alla volta
  start(t)
  return t.id
}
function start(t) {
  if (!t.left) return
  t.started = Date.now()
  t.timer = setTimeout(() => dismiss(t.id), t.left)
}
export function pause(t) { if (!t.timer) return; clearTimeout(t.timer); t.timer = null; t.left -= Date.now() - t.started }
export function resume(t) { if (t.left > 0 && !t.timer) start(t) }
export function dismiss(id) { const t = state.items.find(x => x.id === id); if (t?.timer) clearTimeout(t.timer); state.items = state.items.filter(x => x.id !== id) }

export const toastState = state
export function useToast() {
  return {
    success: (m, o) => push('success', m, o), error: (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o), info: (m, o) => push('info', m, o), dismiss,
  }
}

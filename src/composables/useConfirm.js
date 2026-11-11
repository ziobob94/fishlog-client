import { reactive } from 'vue'

// Conferma asincrona al posto di window.confirm: apre un ModalDialog (ConfirmHost,
// montato una volta in App.vue). Uso: if (!(await confirmDialog('Eliminare?'))) return
export const confirmState = reactive({ open: false, title: '', message: '', confirmLabel: '', cancelLabel: '', destructive: true })
let resolver = null

export function confirmDialog(message, opts = {}) {
  resolver?.(false)
  Object.assign(confirmState, { open: true, title: opts.title || '', message, confirmLabel: opts.confirmLabel || '', cancelLabel: opts.cancelLabel || '', destructive: opts.destructive !== false })
  return new Promise(res => { resolver = res })
}
export function settleConfirm(value) {
  confirmState.open = false
  resolver?.(value)
  resolver = null
}

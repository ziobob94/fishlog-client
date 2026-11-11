import { computed } from 'vue'
import { useToast as useMotionToast, toastState, dismiss } from '../components/motion/useToast.js'

// Ponte verso il sistema di toast del movimento (ToastHost): mantiene la
// vecchia firma toast(message, { type }) usata in tutta l'app. `danger` → `error`.
// Opzioni aggiuntive: { action: { label, onClick }, persist, duration }.
const KIND = { info: 'info', success: 'success', warning: 'warning', danger: 'error', error: 'error' }

export function useToast() {
  const t = useMotionToast()
  function toast(message, { type = 'info', ...opts } = {}) {
    return t[KIND[type] || 'info'](message, opts)
  }
  return { toast, dismiss, toasts: computed(() => toastState.items), success: t.success, error: t.error, warning: t.warning, info: t.info }
}

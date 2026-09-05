import { ref } from 'vue'

// Coda di toast condivisa da tutta l'app: un'unica istanza reattiva
// (module-level, non per-componente) così qualunque punto del codice
// può chiamare toast(...) e ToastContainer.vue la renderizza ovunque sia montato.
const toasts = ref([])
let nextId = 0

const DURATIONS = { info: 3200, success: 3200, warning: 4200, danger: 4200 }

function dismiss(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

function toast(message, { type = 'info', duration } = {}) {
  const id = ++nextId
  toasts.value = [...toasts.value, { id, message, type }]
  setTimeout(() => dismiss(id), duration ?? DURATIONS[type] ?? 3200)
  return id
}

export function useToast() {
  return { toasts, toast, dismiss }
}

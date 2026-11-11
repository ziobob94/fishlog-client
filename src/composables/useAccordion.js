// Stato aperto/chiuso di un accordion della Home, ricordato sul dispositivo. Predefinito: aperto.
import { ref } from 'vue'

export function useAccordion(storageKey, defaultOpen = true) {
  const open = ref(defaultOpen)
  try {
    const v = localStorage.getItem(storageKey)
    if (v === '1') open.value = true
    else if (v === '0') open.value = false
  } catch { /* storage non disponibile: vale il predefinito */ }
  function toggle() {
    open.value = !open.value
    try { localStorage.setItem(storageKey, open.value ? '1' : '0') } catch { /* ignora */ }
  }
  return { open, toggle }
}

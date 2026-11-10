import { ref, watch } from 'vue'

// Modalità di visualizzazione degli elenchi (annunci, eBay, negozi),
// ricordata sul dispositivo.
const KEY = 'fishlog_list_view'
export const LIST_VIEWS = ['grid', 'list', 'large', 'grid3']

function read() {
  try { const v = localStorage.getItem(KEY); return LIST_VIEWS.includes(v) ? v : 'grid' } catch { return 'grid' }
}

const view = ref(read())
watch(view, (v) => { try { localStorage.setItem(KEY, v) } catch { /* ignora */ } })

export function useListView() {
  return { view }
}

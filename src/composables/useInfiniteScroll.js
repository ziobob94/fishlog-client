import { ref, computed } from 'vue'

/**
 * Stato di una lista caricata "a scorrimento": pagina corrente più recente
 * caricata, se ce n'è un'altra, e due loading distinti (primo caricamento/
 * reset vs caricamento in coda) così la UI può mostrare uno spinner grande
 * solo al reset e uno piccolo in fondo alla lista durante lo scroll.
 *
 * `fetchPage(page, { append })` deve occuparsi di popolare la lista reattiva
 * (tipicamente nello store) e di aggiornare `pagesRef` con il totale pagine.
 */
export function useInfiniteScroll(fetchPage, pagesRef) {
  const page = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)

  const hasMore = computed(() => page.value < (pagesRef.value || 1))

  async function fetchInto(pageNum, append) {
    const busy = append ? loadingMore : loading
    busy.value = true
    try {
      await fetchPage(pageNum, { append })
      page.value = pageNum
    } finally {
      busy.value = false
    }
  }

  function reset() {
    page.value = 0
    return fetchInto(1, false)
  }

  function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value) return
    return fetchInto(page.value + 1, true)
  }

  return { page, loading, loadingMore, hasMore, reset, loadMore }
}

import { ref } from 'vue'

/**
 * Gestisce lo stato di una lista paginata (pagina corrente, totale pagine,
 * loading) e delega il fetch effettivo a `fetchPage(page)`, che deve
 * restituire il numero totale di pagine (o un oggetto { pages }).
 */
export function usePagination(fetchPage, { initialPage = 1 } = {}) {
  const page    = ref(initialPage)
  const pages   = ref(1)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const result = await fetchPage(page.value)
      const p = typeof result === 'number' ? result : result?.pages
      if (p !== undefined) pages.value = p
      return result
    } finally {
      loading.value = false
    }
  }

  function goTo(n) {
    page.value = n
    return load()
  }

  function reset() {
    page.value = initialPage
    return load()
  }

  return { page, pages, loading, load, goTo, reset }
}

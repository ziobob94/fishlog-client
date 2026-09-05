/**
 * Restituisce una versione debounced di `fn`: le chiamate ravvicinate
 * vengono raccolte e solo l'ultima viene eseguita dopo `delay` ms.
 */
export function useDebouncedFn(fn, delay = 320) {
  let timer = null

  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }

  debounced.cancel = () => clearTimeout(timer)

  return debounced
}

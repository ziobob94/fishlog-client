import { watch, onBeforeUnmount } from 'vue'

/**
 * Chiude un menu/popover con un tap fuori o con Esc.
 *
 * - Usa `pointerdown` in fase di cattura: su iOS Safari `click` sul document
 *   non scatta se il target non è "cliccabile", quindi un listener `click`
 *   non basta.
 * - Il tap fuori serve solo a chiudere: il `click` successivo viene
 *   intercettato e annullato, così non parte l'azione dell'elemento sotto.
 * - Un trascinamento (scroll) non chiude e non blocca nulla: il click
 *   viene soppresso solo se arriva subito dopo il pointerdown.
 *
 * @param {import('vue').Ref<boolean>} open  stato aperto/chiuso
 * @param {import('vue').Ref<HTMLElement|null>} elRef  contenitore (trigger + menu)
 */
export function useDismissable(open, elRef) {
  let swallowTimer = null

  function swallowNextClick() {
    const block = (e) => { e.preventDefault(); e.stopPropagation(); stop() }
    const stop = () => {
      document.removeEventListener('click', block, true)
      clearTimeout(swallowTimer)
    }
    document.addEventListener('click', block, true)
    swallowTimer = setTimeout(stop, 400)
  }

  function onPointerDown(e) {
    if (!open.value) return
    const root = elRef.value
    if (root && root.contains(e.target)) return
    open.value = false
    if (e.pointerType === 'touch' || e.pointerType === 'mouse' || e.pointerType === 'pen') swallowNextClick()
  }

  function onKey(e) {
    if (open.value && e.key === 'Escape') open.value = false
  }

  function attach() {
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
  }
  function detach() {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('keydown', onKey)
  }

  watch(open, (v) => { v ? attach() : detach() }, { immediate: true })
  onBeforeUnmount(() => { detach(); clearTimeout(swallowTimer) })
}

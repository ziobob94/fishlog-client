// Azioni sulle località preferite con i loro avvisi: usate dalla stella, dal foglio «Gestisci» e da «Aggiungi».
import { useI18n } from 'vue-i18n'
import { useToast } from '../components/motion/useToast.js'
import { useFavoritesStore } from '../stores/favorites.js'
import { MAX_FAVORITES } from '../utils/favorites.js'

export const UNDO_MS = 6000

export function useFavoriteActions() {
  const { t } = useI18n()
  const toast = useToast()
  const fav = useFavoritesStore()

  // Esito negativo → avviso adatto. Ritorna true se l'operazione è riuscita.
  function report(status, name = '') {
    if (status === 'ok' || status === 'added' || status === 'removed') return true
    if (status === 'limit') toast.warning(t('favorites.limit', { n: MAX_FAVORITES }))
    else if (status === 'offline') toast.warning(t('favorites.offlineEdit'))
    else if (status === 'duplicate') toast.info(t('favorites.duplicate', { name }))
    else if (status !== 'missing') toast.error(t('favorites.saveError'))
    return false
  }

  // Toglie una località e offre «Annulla» per 6 s.
  async function removeWithUndo(id) {
    const r = await fav.remove(id)
    if (!report(r.status)) return false
    toast.info(t('favorites.removed', { name: r.removed.name }), {
      duration: UNDO_MS,
      action: { label: t('favorites.undo'), onClick: async () => { report(await fav.undoRemove(r.removed, r.index)) } },
    })
    return true
  }

  async function addPlace(place) {
    const s = await fav.add(place)
    if (!report(s, place.name)) return false
    toast.success(t('favorites.added', { name: place.name }))
    return true
  }

  // Stella on/off.
  async function toggle(place) {
    const same = fav.findSame(place)
    if (same) return removeWithUndo(same.id)
    return addPlace(place)
  }

  return { report, removeWithUndo, addPlace, toggle }
}

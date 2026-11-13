// Località preferite della Home: regole pure (limite, ordine, annulla) e cache locale in sola lettura.
export const MAX_FAVORITES = 8
export const CARDS_FRESH_MS = 15 * 60e3
const LIST_KEY = 'fishlog_favorites_v1'
const CARDS_KEY = 'fishlog_favorite_cards_v1'

const lonOf = p => Number(p?.lon ?? p?.lng)
export const sameSpot = (a, b) => !!a && !!b && Math.abs(Number(a.lat) - Number(b.lat)) < 0.001 && Math.abs(lonOf(a) - lonOf(b)) < 0.001
export const newFavoriteId = () => `fp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
const renumber = list => list.map((p, i) => ({ ...p, order: i }))

// → { list, error: null | 'limit' | 'duplicate' }
export function addFavorite(list, place) {
  if (list.some(p => sameSpot(p, place))) return { list, error: 'duplicate' }
  if (list.length >= MAX_FAVORITES) return { list, error: 'limit' }
  const item = { id: place.id || newFavoriteId(), name: String(place.name || '').trim(), lat: Number(place.lat), lon: lonOf(place), order: list.length }
  return { list: renumber([...list, item]), error: null }
}
// → { list, removed, index }
export function removeFavorite(list, id) {
  const index = list.findIndex(p => p.id === id)
  if (index < 0) return { list, removed: null, index: -1 }
  return { list: renumber(list.filter(p => p.id !== id)), removed: list[index], index }
}
// Annulla rimozione: rimette la scheda al suo posto (se non c'è più spazio o è già tornata, non cambia nulla).
export function restoreFavorite(list, item, index) {
  if (!item || list.some(p => p.id === item.id) || list.length >= MAX_FAVORITES) return list
  const next = [...list]
  next.splice(Math.min(Math.max(index, 0), next.length), 0, item)
  return renumber(next)
}
export function moveFavorite(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  next.splice(to, 0, next.splice(from, 1)[0])
  return renumber(next)
}
export const sortFavorites = list => renumber([...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))

function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* spazio finito o storage bloccato */ } }
export const readListCache = () => { const c = read(LIST_KEY); return Array.isArray(c?.places) ? sortFavorites(c.places) : null }
export const writeListCache = places => write(LIST_KEY, { places, savedAt: Date.now() })
export const readCardsCache = () => read(CARDS_KEY) || {}
export const writeCardsCache = cards => write(CARDS_KEY, cards)
export const clearFavoritesCache = () => { try { localStorage.removeItem(LIST_KEY); localStorage.removeItem(CARDS_KEY) } catch { /* ignora */ } }

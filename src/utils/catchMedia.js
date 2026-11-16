// Foto e video di una cattura (c.media: [{ _id, url, type: 'photo' | 'video', caption }]).
export const visibleMedia = media => (Array.isArray(media) ? media : []).filter(m => m && m.url)

// Copertina per le miniature: la prima foto; se ci sono solo video, il primo video.
export function coverOf(media) {
  const list = visibleMedia(media)
  return list.find(m => m.type !== 'video') || list[0] || null
}

// Posizione della diapositiva visibile in uno scroll orizzontale con snap.
export function slideIndexAt(scrollLeft, slideWidth, count) {
  if (!count || !slideWidth) return 0
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / slideWidth)))
}

// Chi può eliminare: l'autore. Le uscite in coda offline senza userId sono sempre dell'utente.
export function isAuthor(session, me) {
  if (!session) return false
  if (session._pending || !session.userId) return true
  return String(session.userId?._id || session.userId) === String(me)
}

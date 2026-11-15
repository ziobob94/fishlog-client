import api from './api.js'

// Link pubblico di sola lettura di un'uscita: lo crea e lo revoca solo l'autore.
export const sessionShareApi = {
  create: (id) => api.post(`/sessions/${id}/share`).then(r => r.data),
  revoke: (id) => api.delete(`/sessions/${id}/share`).then(r => r.data),
  publicView: (token) => api.get(`/public/sessions/${token}`).then(r => r.data),
}

// Condivide con il pannello del sistema (WhatsApp, Telegram...) se disponibile.
// Restituisce 'shared' | 'cancelled' | 'unsupported'.
export async function nativeShare({ title, text, url }) {
  if (typeof navigator === 'undefined' || !navigator.share) return 'unsupported'
  try { await navigator.share({ title, text, url }); return 'shared' }
  catch (e) { return e?.name === 'AbortError' ? 'cancelled' : 'unsupported' }
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

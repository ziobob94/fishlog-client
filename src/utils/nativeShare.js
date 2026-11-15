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

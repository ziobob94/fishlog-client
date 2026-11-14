// Fishy: logica pura (testabile) del pulsante e del foglio.

// Stato del pulsante, in ordine di priorità. Ciò che richiede un gesto dell'utente vince su ciò che è solo informativo.
//   listening  sta registrando · busy  il server sta capendo · error  l'ultima richiesta è fallita
//   success    appena eseguita · limit  servizio AI al limite (richieste in coda) · offline  richieste in coda per la rete
//   first      i primi usi, con il fumetto «Parla con Fishy» · idle  a riposo
export function fabState({ listening = false, busy = false, error = false, success = false, limit = false, queued = 0, offline = false, introLeft = 0 } = {}) {
  if (listening) return 'listening'
  if (busy) return 'busy'
  if (error) return 'error'
  if (success) return 'success'
  if (limit) return 'limit'
  if (offline || queued > 0) return 'offline'
  if (introLeft > 0) return 'first'
  return 'idle'
}

// Espressione della mascotte per ogni stato.
export const EXPRESSION = { idle: 'rest', first: 'rest', listening: 'listen', busy: 'think', success: 'happy', error: 'confused', offline: 'offline', limit: 'limit' }

// Pesce animato del pulsante (FishyAnimated): solo 4 stati. Errore, offline e limite restano le espressioni ferme di Fishy.vue (null).
// Il successo salta una volta sola (OK_MS) e poi il pesce torna a riposo, mentre il bordo resta verde fino alla fine del flash.
export const OK_MS = 700
export const ANIM_STATE = { idle: 'idle', first: 'idle', listening: 'listen', busy: 'think', success: 'ok' }
export function animState(state, okDone = false) {
  const a = ANIM_STATE[state] || null
  return a === 'ok' && okDone ? 'idle' : a
}

// Contatori in locale: il fumetto compare per i primi 3 usi, gli esempi «Prova:» si riducono dopo qualche uso.
export const INTRO_USES = 3
export const EXAMPLES_FULL_UNTIL = 3
const KEY = 'fishy.uses'
const store = () => { try { return globalThis.localStorage } catch { return null } }
export function readUses() { const n = parseInt(store()?.getItem(KEY) || '0', 10); return Number.isFinite(n) ? n : 0 }
export function bumpUses() { const n = readUses() + 1; try { store()?.setItem(KEY, String(n)) } catch { /* modalità privata */ } return n }

// Prossimo ammicco a riposo: ogni 20–30 s (`rnd` iniettabile per i test).
export const nextBlinkMs = (rnd = Math.random) => 20000 + Math.round(rnd() * 10000)

// Pillola con il timer: m:ss in mono.
export function formatElapsed(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

// Zona di annullo del «tieni premuto»: rilasciando oltre questa distanza a sinistra del punto di partenza non si invia.
export const CANCEL_DX = 72
export const isCancelZone = (startX, x) => startX - x >= CANCEL_DX

// Richieste per Fishy in coda (offline o servizio AI al limite) dalla coda offline.
export const queuedCount = (outbox = []) => outbox.filter(i => i.meta?.kind === 'assistant' || i.meta?.kind === 'voice-catch').length
// Numero sul badge: «9+» oltre le nove.
export const badgeLabel = n => n > 9 ? '9+' : n > 0 ? String(n) : ''

import { ref } from 'vue'

// Ultimo scambio con Fishy (niente storico: ogni comando sostituisce il precedente) e annullo con «Ripristina».
//
// Come funziona «Ripristina»: le azioni di Fishy sono già salvate dal server e l'API non ha un «ri-esegui».
// Riprovare con lo stesso voiceId non serve (è idempotente: il server restituirebbe l'esito vecchio) e un nuovo
// voiceId farebbe reinterpretare la frase all'AI (costo, limite, esito diverso). Quindi l'annullo è RITARDATO:
// «Annulla» segna subito la riga come «Annullato · Ripristina · N s»; la chiamata di annullo parte allo scadere
// di N secondi, a meno che si tocchi «Ripristina» (che cancella solo il timer, nessuna chiamata). Se l'app va in
// background il timer si salda subito (flush), perché potrebbe non tornare.
export const RESTORE_SECONDS = 6

export function createFishyConversation({ undo, restoreSeconds = RESTORE_SECONDS, setTimer = setInterval, clearTimer = clearInterval } = {}) {
  const last = ref(null) // { text, rows: [], at }

  function start(text) { last.value = { text, rows: [], notes: [], at: Date.now() }; return last.value }
  function addRow(row) {
    if (!last.value) start('')
    const r = { state: 'done', left: 0, timer: null, ...row }
    last.value.rows.push(r)
    return last.value.rows[last.value.rows.length - 1] // proxy reattivo
  }

  async function commit(row) {
    clearTimer(row.timer); row.timer = null
    if (row.state !== 'undoing') return
    let ok = false
    try { ok = await undo(row.result) } catch { ok = false }
    row.state = ok ? 'undone' : 'failed'
  }
  function undoRow(row) {
    if (row.state !== 'done' && row.state !== 'failed') return
    row.state = 'undoing'; row.left = restoreSeconds
    row.timer = setTimer(() => { row.left -= 1; if (row.left <= 0) commit(row) }, 1000)
  }
  function restoreRow(row) {
    if (row.state !== 'undoing') return
    clearTimer(row.timer); row.timer = null; row.state = 'done'; row.left = 0
  }
  const flush = () => Promise.all((last.value?.rows || []).filter(r => r.state === 'undoing').map(commit))
  // Nuovo comando: le azioni dell'ultimo scambio restano com'erano (un annullo in attesa si salda), poi lo scambio è sostituito.
  const clear = () => { flush(); last.value = null }

  return { last, start, addRow, undoRow, restoreRow, flush, clear }
}

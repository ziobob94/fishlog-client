import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFishyConversation, RESTORE_SECONDS } from '../src/composables/fishyConversation.js'

const res = n => ({ action: 'catch', status: 'saved', catch: { _id: n } })

describe('annullo e ripristino', () => {
  let undo, conv
  beforeEach(() => { vi.useFakeTimers(); undo = vi.fn().mockResolvedValue(true); conv = createFishyConversation({ undo }) })
  afterEach(() => vi.useRealTimers())

  it('Annulla non chiama subito il server: parte allo scadere dei secondi', async () => {
    conv.start('ho preso una spigola'); const row = conv.addRow({ result: res('a') })
    conv.undoRow(row)
    expect(row.state).toBe('undoing'); expect(row.left).toBe(RESTORE_SECONDS)
    expect(undo).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(RESTORE_SECONDS * 1000)
    expect(undo).toHaveBeenCalledTimes(1); expect(undo).toHaveBeenCalledWith(row.result)
    expect(row.state).toBe('undone')
  })
  it('Ripristina prima dello scadere non fa nessuna chiamata', async () => {
    conv.start('x'); const row = conv.addRow({ result: res('a') })
    conv.undoRow(row); await vi.advanceTimersByTimeAsync(3000)
    conv.restoreRow(row)
    expect(row.state).toBe('done')
    await vi.advanceTimersByTimeAsync(10000)
    expect(undo).not.toHaveBeenCalled(); expect(row.state).toBe('done')
  })
  it('se l\'annullo fallisce la riga torna annullabile', async () => {
    undo.mockResolvedValue(false)
    conv.start('x'); const row = conv.addRow({ result: res('a') })
    conv.undoRow(row); await vi.advanceTimersByTimeAsync(RESTORE_SECONDS * 1000)
    expect(row.state).toBe('failed')
    conv.undoRow(row); expect(row.state).toBe('undoing')
  })
  it('flush (app in background) salda subito gli annulli in attesa', async () => {
    conv.start('x'); const a = conv.addRow({ result: res('a') }); const b = conv.addRow({ result: res('b') })
    conv.undoRow(a)
    await conv.flush()
    expect(undo).toHaveBeenCalledTimes(1); expect(a.state).toBe('undone'); expect(b.state).toBe('done')
  })
  it('più azioni restano nell\'ordine detto, e il comando successivo sostituisce lo scambio (niente storico)', async () => {
    conv.start('inizio a Tirrenia e ho preso una spigola')
    conv.addRow({ result: { action: 'start_session' }, kind: 'start' }); conv.addRow({ result: res('a'), kind: 'catch' })
    expect(conv.last.value.rows.map(r => r.kind)).toEqual(['start', 'catch'])
    const pending = conv.last.value.rows[1]; conv.undoRow(pending)
    conv.clear()
    expect(conv.last.value).toBe(null)
    await vi.advanceTimersByTimeAsync(0)
    expect(undo).toHaveBeenCalledTimes(1) // l'annullo in attesa non si perde
    conv.start('nuova frase'); expect(conv.last.value.rows).toHaveLength(0); expect(conv.last.value.text).toBe('nuova frase')
  })
})

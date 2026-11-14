import { describe, it, expect } from 'vitest'
import { levelKey, validLevel, visibleFactors, activityState, isStale, windowsText, FRESH_MS } from '../fishActivity.js'

describe('livello 1-5', () => {
  it('mappa i cinque livelli sulle chiavi delle parole', () => {
    expect([1, 2, 3, 4, 5].map(levelKey)).toEqual(['low', 'midLow', 'mid', 'midHigh', 'high'])
  })
  it('mai un livello inventato: valori non validi → null', () => {
    for (const v of [0, 6, 2.5, null, undefined, '3', NaN]) { expect(validLevel(v)).toBeNull(); expect(levelKey(v)).toBeNull() }
  })
})

describe('scelta dei fattori mostrati', () => {
  const f = (key, effect) => ({ key, effect })
  it('al massimo 3, nell\'ordine del server', () => {
    const r = visibleFactors([f('light', 'up'), f('pressure', 'up'), f('wind', 'down'), f('tide', 'flat'), f('waterTemp', 'up')])
    expect(r.map(x => x.key)).toEqual(['light', 'pressure', 'wind'])
  })
  it('scarta chiavi ed effetti sconosciuti e input non validi', () => {
    expect(visibleFactors([f('luna', 'up'), f('light', 'boh'), null, f('tide', 'flat')]).map(x => x.key)).toEqual(['tide'])
    expect(visibleFactors(undefined)).toEqual([])
  })
})

describe('stato dati mancanti, caricamento, offline', () => {
  const rec = (o = {}) => ({ ok: true, level: 3, savedAt: 1, ...o })
  it('senza record: caricamento se in corso, altrimenti dati mancanti', () => {
    expect(activityState({ rec: null, loading: true })).toBe('loading')
    expect(activityState({ rec: null, loading: false })).toBe('missing')
  })
  it('livello null o luogo non raggiungibile → dati mancanti (nessun livello)', () => {
    expect(activityState({ rec: rec({ level: null }) })).toBe('missing')
    expect(activityState({ rec: rec({ ok: false }) })).toBe('missing')
    expect(activityState({ rec: rec({ level: 9 }) })).toBe('missing')
  })
  it('livello valido: ok online, offline senza rete', () => {
    expect(activityState({ rec: rec() })).toBe('ok')
    expect(activityState({ rec: rec(), online: false })).toBe('offline')
  })
  it('un dato più vecchio di 15 minuti va ricalcolato', () => {
    expect(isStale(rec({ savedAt: 1000 }), 1000 + FRESH_MS)).toBe(false)
    expect(isStale(rec({ savedAt: 1000 }), 1001 + FRESH_MS)).toBe(true)
    expect(isStale(null)).toBe(true)
    expect(isStale({ ok: false, savedAt: Date.now() })).toBe(true)
  })
})

describe('testo alternativo', () => {
  it('riassume le finestre o dice che nessuna spicca', () => {
    expect(windowsText([{ from: '05:00', to: '08:00' }, { from: '19:00', to: '21:00' }], 'nessuna')).toBe('05:00-08:00, 19:00-21:00')
    expect(windowsText([], 'nessuna')).toBe('nessuna')
  })
})

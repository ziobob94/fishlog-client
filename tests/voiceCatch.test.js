import { describe, it, expect } from 'vitest'
import { summarizeCatch, cleanTranscript, withCatches, withoutCatch } from '../src/utils/voiceCatch.js'

describe('voiceCatch utils', () => {
  it('riassume la cattura con virgola decimale', () => {
    expect(summarizeCatch({ species: 'Spigola', weightKg: 2.5, lengthCm: 55, released: true })).toBe('Spigola · 2,5 kg · 55 cm · rilasciata')
    expect(summarizeCatch({ species: 'Orata' })).toBe('Orata')
  })
  it('pulisce e limita il testo', () => {
    expect(cleanTranscript('  una   spigola \n da due chili ')).toBe('una spigola da due chili')
    expect(cleanTranscript('x'.repeat(700))).toHaveLength(600)
  })
  it('aggiunge catture senza duplicare e le toglie con Annulla', () => {
    const s = { _id: 's', catches: [{ _id: 'a', species: 'Orata' }] }
    const added = withCatches(s, [{ _id: 'a', species: 'Orata' }, { _id: 'b', species: 'Spigola' }])
    expect(added.catches.map(c => c._id)).toEqual(['a', 'b'])
    expect(added.totalCatches).toBe(2)
    expect(withoutCatch(added, 'b').catches.map(c => c._id)).toEqual(['a'])
  })
})

import { isRetryableAiError } from '../src/stores/offline.js'
describe('coda: errori AI ritentabili', () => {
  it('429/503 del servizio AI restano in coda, gli altri errori no', () => {
    expect(isRetryableAiError({ response: { status: 429, data: { code: 'ai_rate_limit' } } })).toBe(true)
    expect(isRetryableAiError({ response: { status: 503, data: { code: 'ai_unavailable' } } })).toBe(true)
    expect(isRetryableAiError({ response: { status: 503, data: { code: 'ai_not_configured' } } })).toBe(false)
    expect(isRetryableAiError({ response: { status: 400, data: {} } })).toBe(false)
    expect(isRetryableAiError({})).toBe(false)
  })
})

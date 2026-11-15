import { describe, it, expect } from 'vitest'
import { qrMatrix, qrSvg } from '../qr.js'

describe('codice QR', () => {
  it('sceglie la versione dalla lunghezza del testo', () => {
    expect(qrMatrix('https://fishlog.it/gare/p/abc123').length).toBe(29)   // versione 3
    expect(qrMatrix('x').length).toBe(21)                                 // versione 1
  })
  it('ha i tre pattern di ricerca agli angoli', () => {
    const m = qrMatrix('https://fishlog.it/gare/p/abc123'), n = m.length
    for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      expect(m[y][x]).toBe(true); expect(m[y + 3][x + 3]).toBe(true); expect(m[y + 1][x + 1]).toBe(false)
    }
  })
  it('è deterministico e produce un SVG', () => {
    expect(qrSvg('ciao')).toBe(qrSvg('ciao'))
    expect(qrSvg('ciao')).toMatch(/^<svg /)
  })
  it('rifiuta testi troppo lunghi', () => { expect(() => qrMatrix('a'.repeat(400))).toThrow() })
})

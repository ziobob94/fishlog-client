import { test, expect } from 'vitest'
import { leggiCsv, fmtPos } from '../src/utils/fipsas.js'

test('CSV con intestazione e punto e virgola', () => {
  const r = leggiCsv('Cognome;Nome;Società;Squadra\nRossi;Mario;Casting Club;A\nBianchi;Luca;Casting Club;*')
  expect(r).toEqual([
    { cognome: 'Rossi', nome: 'Mario', societa: 'Casting Club', squadra: 'A' },
    { cognome: 'Bianchi', nome: 'Luca', societa: 'Casting Club', squadra: '*' },
  ])
})

test('CSV con virgole e senza intestazione', () => {
  expect(leggiCsv('Verdi,Anna,Surf Club,B')).toEqual([{ cognome: 'Verdi', nome: 'Anna', societa: 'Surf Club', squadra: 'B' }])
})

test('posto medio con la virgola', () => {
  expect(fmtPos(4.5)).toBe('4,5')
  expect(fmtPos(null)).toBe('–')
})

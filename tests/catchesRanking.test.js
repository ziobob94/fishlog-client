import { describe, it, expect } from 'vitest'
import { rankCatches, filterBySpecies, groupBySpecies, summarize, fmtKg } from '../src/utils/catchesRanking.js'

const C = (species, weightKg, lengthCm, date = '2025-10-01') => ({ species, weightKg, lengthCm, date })
const data = [
  C('Orata', 1.9, 44), C('Spigola', 3.2, 62), C('Sarago', 0.9, 33),
  C('spigola', 1.6, 51, '2025-10-26'), C('Mormora', null, null), C('Orata', 1.1, 38, '2025-11-05')
]

describe('ordinamento', () => {
  it('per peso: decrescente, valori mancanti in fondo', () => {
    expect(rankCatches(data, { sort: 'weight' }).map(c => c.weightKg)).toEqual([3.2, 1.9, 1.6, 1.1, 0.9, null])
  })
  it('per lunghezza: cambia il criterio, stessa lista', () => {
    const r = rankCatches(data, { sort: 'length' })
    expect(r.map(c => c.lengthCm)).toEqual([62, 51, 44, 38, 33, null])
    expect(r).toHaveLength(data.length)
  })
  it('a parità vince la cattura più recente e non muta l\'input', () => {
    const tie = [C('A', 1, 10, '2025-01-01'), C('B', 1, 10, '2025-06-01')]
    expect(rankCatches(tie).map(c => c.species)).toEqual(['B', 'A'])
    expect(tie[0].species).toBe('A')
  })
})

describe('filtro per specie', () => {
  it('ignora maiuscole e spazi', () => {
    expect(filterBySpecies(data, ' SPIGOLA ')).toHaveLength(2)
  })
  it('combinato con l\'ordinamento', () => {
    expect(rankCatches(data, { sort: 'weight', species: 'orata' }).map(c => c.weightKg)).toEqual([1.9, 1.1])
  })
  it('specie assente → lista vuota; specie vuota → tutte', () => {
    expect(filterBySpecies(data, 'Luccio')).toEqual([])
    expect(filterBySpecies(data, '')).toHaveLength(data.length)
  })
  it('per specie: record e conteggio, più catture prima', () => {
    const g = groupBySpecies(data)
    expect(g.map(x => x.count)).toEqual([2, 2, 1, 1])
    expect(g.find(x => x.species === 'Spigola')).toMatchObject({ count: 2, recordWeightKg: 3.2, recordLengthCm: 62 })
    expect(g.find(x => x.species === 'Orata')).toMatchObject({ count: 2, recordWeightKg: 1.9 })
    expect(g.find(x => x.species === 'Mormora')).toMatchObject({ count: 1, recordWeightKg: null })
  })
})

describe('nessuna cattura', () => {
  it('liste vuote senza errori', () => {
    expect(rankCatches([], { sort: 'length' })).toEqual([])
    expect(groupBySpecies([])).toEqual([])
    expect(summarize([])).toEqual({ catches: 0, species: 0, maxWeightKg: null, record: null })
  })
  it('formattazione dei valori mancanti', () => {
    expect(fmtKg(null)).toBe('–')
    expect(fmtKg(3.2)).toBe('3,2')
  })
})

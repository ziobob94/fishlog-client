import { describe, it, expect } from 'vitest'
import { hourAxis, pressureSeries } from '../src/utils/weather.js'

describe('hourAxis', () => {
  it('mette una tacca ogni 6 ore e il giorno a mezzanotte', () => {
    const times = Array.from({ length: 30 }, (_, i) => `2026-11-12T${String((i + 20) % 24).padStart(2, '0')}:00`)
    const a = hourAxis(times, '2026-11-12', 7)
    expect(a.ticks.map(t => t.label)).toEqual(['00', '06', '12', '18'].filter(l => times.some(t => t.includes(`T${l}`))).length ? a.ticks.map(t => t.label) : [])
    expect(a.days[0].x).toBe(0)
    expect(a.ticks.every(t => t.x % 7 === 0)).toBe(true)
  })
})
describe('pressureSeries', () => {
  it('ignora i valori mancanti e trova minimo e massimo', () => {
    const s = pressureSeries([{ time: 'a', pressure: 1012 }, { time: 'b', pressure: null }, { time: 'c', pressure: 1008 }, { time: 'd', pressure: 1015 }])
    expect(s.points).toHaveLength(3); expect(s.min).toBe(1008); expect(s.max).toBe(1015)
  })
  it('con meno di 2 punti è vuota', () => { expect(pressureSeries([{ time: 'a', pressure: 1010 }]).points).toEqual([]) })
})

import { metricRows } from '../src/utils/weather.js'
describe('metricRows (dettaglio orario dei riquadri)', () => {
  const view = {
    hourly: [
      { time: '2026-11-25T09:00', date: '2026-11-25', hour: 9, windSpeed: 12, windGust: 20, pressure: 1012, precipProbability: 10, precipMm: 0 },
      { time: '2026-11-25T10:00', date: '2026-11-25', hour: 10, windSpeed: null, windGust: null, pressure: 1011, precipProbability: 40, precipMm: 0.6 },
    ],
    marine: { waves: [{ time: '2026-11-25T09:00', height: 0.8, period: 5 }, { time: '2026-11-25T10:00', height: null, period: null }] },
  }
  it('vento: salta le ore senza valore e porta le raffiche', () => {
    const r = metricRows('wind', view); expect(r).toHaveLength(1); expect(r[0].extra.gust).toBe(20)
  })
  it('pressione e pioggia', () => {
    expect(metricRows('pressure', view).map(r => r.value)).toEqual([1012, 1011])
    expect(metricRows('rain', view)[1].extra.mm).toBe(0.6)
  })
  it('onda: legge marine.waves', () => {
    const r = metricRows('wave', view); expect(r).toHaveLength(1); expect(r[0]).toMatchObject({ hour: 9, date: '2026-11-25', value: 0.8 })
  })
  it('senza dati è vuoto', () => { expect(metricRows('wind', null)).toEqual([]) })
})

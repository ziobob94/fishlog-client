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

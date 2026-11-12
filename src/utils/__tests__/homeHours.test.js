import { describe, it, expect } from 'vitest'
import { homeHours, dayLabelOf } from '../weather.js'

describe('homeHours', () => {
  const daily = [{ date: '2026-11-12', sunrise: '07:00', sunset: '17:00' }, { date: '2026-11-13', sunrise: '07:01', sunset: '16:59' }]
  const h = (date, hour) => ({ time: `${date}T${String(hour).padStart(2, '0')}:00`, date, hour, temp: 10, windSpeed: 5, windDeg: 90, wmo: 1 })
  it('etichetta solo la prima ora di un nuovo giorno', () => {
    const r = homeHours([h('2026-11-12', 22), h('2026-11-12', 23), h('2026-11-13', 0), h('2026-11-13', 1)], daily)
    expect(r.map(x => x.dayLabel)).toEqual(['', '', 'Ven 13', ''])
  })
  it('tiene al massimo 168 ore e regge dati vuoti', () => {
    expect(homeHours(Array.from({ length: 200 }, (_, i) => h('2026-11-12', i % 24)), daily)).toHaveLength(168)
    expect(homeHours(undefined, undefined)).toEqual([])
  })
  it('dayLabelOf', () => {
    expect(dayLabelOf('2026-11-12')).toBe('Gio 12')
    expect(dayLabelOf(null)).toBe('')
  })
})

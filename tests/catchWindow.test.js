import { describe, it, expect } from 'vitest'
import { checkCatchTime } from '../src/utils/catchWindow.js'

const s = (startTime, endTime, status = 'closed') => ({ startTime, endTime, status })

describe('checkCatchTime', () => {
  it('dentro la fascia', () => expect(checkCatchTime(s('06:00', '10:00'), '08:30').ok).toBe(true))
  it('estremi inclusi', () => {
    expect(checkCatchTime(s('06:00', '10:00'), '10:00').ok).toBe(true)
    expect(checkCatchTime(s('06:00', '10:00'), '06:00').ok).toBe(true)
  })
  it('dopo la fine', () => expect(checkCatchTime(s('06:00', '10:00'), '10:20')).toEqual({ ok: false, side: 'after', time: '10:20' }))
  it('prima dell\'inizio', () => expect(checkCatchTime(s('06:00', '10:00'), '05:10')).toEqual({ ok: false, side: 'before', time: '05:10' }))
  it('a cavallo della mezzanotte', () => {
    expect(checkCatchTime(s('22:00', '02:00'), '23:30').ok).toBe(true)
    expect(checkCatchTime(s('22:00', '02:00'), '01:00').ok).toBe(true)
    expect(checkCatchTime(s('22:00', '02:00'), '03:00').side).toBe('after')
    expect(checkCatchTime(s('22:00', '02:00'), '20:00').side).toBe('before')
  })
  it('nessun controllo senza ora, senza estremi o se in corso', () => {
    expect(checkCatchTime(s('06:00', '10:00'), '').ok).toBe(true)
    expect(checkCatchTime(s('06:00', ''), '12:00').ok).toBe(true)
    expect(checkCatchTime(s('06:00', '10:00', 'ongoing'), '12:00').ok).toBe(true)
  })
})

describe('checkCatchTime con uscite di più giorni', () => {
  const m = (startTime, endTime, date, endDate) => ({ startTime, endTime, date, endDate, status: 'closed' })
  it('ogni ora è valida se dura un giorno o più', () => {
    const x = m('20:00', '10:00', '2026-06-01', '2026-06-04')
    expect(checkCatchTime(x, '03:00').ok).toBe(true)
    expect(checkCatchTime(x, '15:00').ok).toBe(true)
  })
  it('con data di fine sotto le 24 ore vale la fascia oraria', () => {
    const x = m('22:00', '02:00', '2026-06-01', '2026-06-02')
    expect(checkCatchTime(x, '12:00').ok).toBe(false)
    expect(checkCatchTime(x, '23:00').ok).toBe(true)
  })
})

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

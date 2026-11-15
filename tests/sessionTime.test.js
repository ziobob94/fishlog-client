import { describe, it, expect } from 'vitest'
import { sessionMinutes, elapsedLabel } from '../src/utils/sessionTime.js'

const s = (date, startTime, endTime, endDate) => ({ date: `${date}T00:00:00.000Z`, startTime, endTime, endDate: endDate && `${endDate}T00:00:00.000Z`, status: 'closed' })

describe('sessionMinutes', () => {
  it('stesso giorno', () => expect(sessionMinutes(s('2026-06-01', '06:00', '10:30'))).toBe(270))
  it('notturna senza data di fine: +1 giorno', () => expect(sessionMinutes(s('2026-06-01', '22:00', '02:00'))).toBe(240))
  it('più giorni', () => {
    expect(sessionMinutes(s('2026-06-01', '20:00', '10:00', '2026-06-04'))).toBe(3 * 1440 - 600)
    expect(elapsedLabel(s('2026-06-01', '20:00', '10:00', '2026-06-04'))).toBe('62:00')
  })
  it('nessun limite di durata e mai negativa', () => {
    expect(sessionMinutes(s('2026-06-01', '08:00', '07:00'))).toBe(23 * 60)
    expect(sessionMinutes(s('2026-06-02', '08:00', '09:00', '2026-06-01'))).toBe(60)
  })
  it('senza orari non c\'è durata', () => expect(sessionMinutes(s('2026-06-01', '', '10:00'))).toBeNull())
})

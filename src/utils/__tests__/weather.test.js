import { describe, it, expect } from 'vitest'
import {
  fmt, fmtSigned, MISSING, compass, windInfo, headingTo, pressureState, moonLabel, hhmm, daylight, dayLabel,
  conditionText, uvLabel, nextTides, tideSummary, normalizeOverview, isPartial, waveSeries, groupHoursByDay, firstExtendedIndex,
} from '../weather.js'

describe('null → «—» (mai 0)', () => {
  it.each([[null], [undefined], [NaN], ['x'], [Infinity]])('%s diventa —', v => expect(fmt(v)).toBe(MISSING))
  it('lo zero vero resta 0', () => expect(fmt(0)).toBe('0'))
  it('arrotonda e usa la virgola', () => { expect(fmt(14.4)).toBe('14'); expect(fmt(0.84, 1)).toBe('0,8'); expect(fmt(-3.2)).toBe('−3') })
  it('niente «-0»', () => expect(fmt(-0.2)).toBe('0'))
  it('segno esplicito per le maree', () => { expect(fmtSigned(0.21)).toBe('+0,21'); expect(fmtSigned(-0.18)).toBe('−0,18'); expect(fmtSigned(null)).toBe(MISSING) })
})

describe('direzione del vento', () => {
  it('315° è «da NO» e la freccia punta a sud-est (135°)', () => {
    const w = windInfo(18, 315)
    expect(w).toMatchObject({ calm: false, abbr: 'NO', name: 'nord-ovest', arrow: 135, from: 'da NO · 315°' })
  })
  it.each([[0, 'N', 180], [45, 'NE', 225], [90, 'E', 270], [180, 'S', 0], [270, 'O', 90], [360, 'N', 180], [-45, 'NO', 135]])('%i° → %s, freccia %i°', (deg, abbr, arrow) => {
    const w = windInfo(10, deg); expect(w.abbr).toBe(abbr); expect(w.arrow).toBe(arrow)
  })
  it('calmo = nessuna freccia e nessun testo di direzione', () => {
    expect(windInfo(1, 200)).toEqual({ calm: true, arrow: null, from: null, abbr: null, name: null, deg: null })
  })
  it('senza direzione: nessuna freccia, non calmo', () => {
    const w = windInfo(12, null); expect(w.calm).toBe(false); expect(w.arrow).toBeNull(); expect(w.from).toBeNull()
  })
  it('senza velocità ma con direzione resta indicato', () => expect(windInfo(null, 90).abbr).toBe('E'))
  it('compass e verso la corrente', () => { expect(compass(null)).toBeNull(); expect(headingTo(0)).toBe('S'); expect(headingTo(null)).toBeNull() })
})

describe('tendenza della pressione', () => {
  it.each([['in_calo', 'falling'], ['in_forte_calo', 'falling'], ['stabile', 'steady'], ['in_aumento', 'rising'], ['in_forte_aumento', 'rising']])('%s → %s', (t, key) => {
    expect(pressureState(t, null).key).toBe(key)
  })
  it('freccia: giù in calo, dritta se stabile, su in aumento', () => {
    expect(pressureState('in_calo', -3).arrowDeg).toBeGreaterThan(0)
    expect(pressureState('stabile', 0).arrowDeg).toBe(0)
    expect(pressureState('in_aumento', 2).arrowDeg).toBeLessThan(0)
  })
  it('senza tendenza né delta: non disponibile', () => expect(pressureState(null, null).key).toBeNull())
  it('senza tendenza ma con delta la ricava', () => { expect(pressureState(null, -2).key).toBe('falling'); expect(pressureState(null, 0.4).key).toBe('steady') })
  it('«forte» è segnalato', () => { expect(pressureState('in_forte_calo', -4).strong).toBe(true); expect(pressureState('in_calo', -2).strong).toBe(false) })
})

describe('luna, orari, giorni', () => {
  it('fasi lunari', () => { expect(moonLabel('luna_piena')).toBe('Luna piena'); expect(moonLabel('boh')).toBe(MISSING) })
  it('HH:MM dal testo ISO', () => { expect(hhmm('2026-11-11T07:05')).toBe('07:05'); expect(hhmm('2026-11-11T07:05:00+01:00')).toBe('07:05'); expect(hhmm(null)).toBe(MISSING) })
  it('ore di luce', () => {
    expect(daylight('2026-11-11T06:52', '2026-11-11T16:55').label).toBe('10 h 03 min')
    expect(daylight(null, '2026-11-11T16:55')).toBeNull()
    expect(daylight('2026-11-11T18:00', '2026-11-11T06:00')).toBeNull()
  })
  it('giorni della settimana', () => { expect(dayLabel('2026-11-11', '2026-11-11')).toBe('Oggi'); expect(dayLabel('2026-11-12', '2026-11-11')).toBe('Gio'); expect(dayLabel(null, 'x')).toBe(MISSING) })
  it('condizione: preferisce il testo Google', () => { expect(conditionText('sole', 'Cielo sereno')).toBe('Cielo sereno'); expect(conditionText('sole', null)).toBe('Sereno'); expect(conditionText(null, null)).toBe(MISSING) })
  it('UV', () => { expect(uvLabel(2)).toBe('basso'); expect(uvLabel(7)).toBe('alto'); expect(uvLabel(null)).toBeNull() })
})

describe('maree stimate', () => {
  const tides = { extremes: [
    { time: '2026-11-11T06:01', type: 'bassa', height: -0.18 }, { time: '2026-11-11T12:14', type: 'alta', height: 0.21 },
    { time: '2026-11-11T18:27', type: 'bassa', height: -0.17 }, { time: '2026-11-12T00:39', type: 'alta', height: 0.22 }, { time: '2026-11-12T06:52', type: 'bassa', height: -0.16 },
  ] }
  it('le prossime 4 dopo adesso', () => {
    const n = nextTides(tides, '2026-11-11T14:02')
    expect(n.map(e => e.hhmm)).toEqual(['18:27', '00:39', '06:52'])
    expect(nextTides(tides, '2026-11-11T05:00', 4)).toHaveLength(4)
  })
  it('senza maree: lista vuota', () => expect(nextTides(null, 'x')).toEqual([]))
  it('riepilogo testuale', () => expect(tideSummary(nextTides(tides, '2026-11-11T14:02', 1))).toBe('bassa alle 18:27 (−0,17 m)'))
})

describe('normalizeOverview', () => {
  it('risposta nulla o non valida → null', () => { expect(normalizeOverview(null)).toBeNull(); expect(normalizeOverview('x')).toBeNull() })
  it('blocchi mancanti: tutto null, mai 0, mare non disponibile', () => {
    const v = normalizeOverview({ current: { temp: 14 } })
    expect(v.current.temp).toBe(14)
    expect(v.current.windSpeed).toBeNull()
    expect(v.marine.available).toBe(false)
    expect(v.marine.waveHeight).toBeNull()
    expect(v.hourly).toEqual([])
    expect(v.fishing.pressure.trend).toBeNull()
    expect(isPartial(v)).toBe(true)
  })
  it('un valore 0 vero resta 0', () => {
    expect(normalizeOverview({ current: { precipMm: 0, windSpeed: 0 } }).current.precipMm).toBe(0)
  })
  it('collega l\'onda massima al giorno', () => {
    const v = normalizeOverview({ daily: [{ date: '2026-11-11' }, { date: '2026-11-12' }], marine: { available: true, dailyWaveMax: [{ date: '2026-11-12', waveHeightMax: 1.2 }] } })
    expect(v.daily[0].waveHeightMax).toBeNull(); expect(v.daily[1].waveHeightMax).toBe(1.2)
  })
  it('maree senza serie → null', () => expect(normalizeOverview({ marine: { available: true, tides: { series: [] } } }).marine.tides).toBeNull())
  it('dati completi non sono parziali', () => expect(isPartial(normalizeOverview({ current: { temp: 1, windSpeed: 2, pressure: 1000, humidity: 50 } }))).toBe(false))
})

describe('onde ora per ora', () => {
  it('la serie si normalizza e i valori non numerici diventano null', () => {
    const v = normalizeOverview({ marine: { available: true, waves: [{ time: 'a', height: 0.5, period: 4 }, { time: 'b', height: 'x', period: null }] } })
    expect(v.marine.waves).toEqual([{ time: 'a', height: 0.5, period: 4 }, { time: 'b', height: null, period: null }])
  })
  it('senza onde: lista vuota', () => expect(normalizeOverview({ marine: { available: true } }).marine.waves).toEqual([]))
  it('waveSeries scarta i punti senza altezza e trova il massimo', () => {
    const r = waveSeries([{ time: 'a', height: 0.5 }, { time: 'b', height: null }, { time: 'c', height: 1.2 }, { time: 'd', height: 0 }])
    expect(r.points).toHaveLength(3); expect(r.max).toBe(1.2); expect(r.maxTime).toBe('c'); expect(r.maxIndex).toBe(1)
  })
  it('meno di 2 punti: nessun grafico', () => { expect(waveSeries([{ time: 'a', height: 1 }]).points).toEqual([]); expect(waveSeries(null).max).toBeNull() })
})

describe('ore per giorno e fonte', () => {
  const rows = [
    { date: '2026-11-11', hour: 22, source: 'google' }, { date: '2026-11-11', hour: 23, source: 'google' },
    { date: '2026-11-12', hour: 0, source: 'google' }, { date: '2026-11-13', hour: 0, source: 'open-meteo' }, { date: null, hour: 1 },
  ]
  it('raggruppa per data nell\'ordine ricevuto e scarta le righe senza data', () => {
    const g = groupHoursByDay(rows)
    expect(g.map(d => [d.date, d.rows.length, d.extended])).toEqual([['2026-11-11', 2, false], ['2026-11-12', 1, false], ['2026-11-13', 1, true]])
  })
  it('input non valido → nessun giorno', () => { expect(groupHoursByDay(null)).toEqual([]); expect(groupHoursByDay([])).toEqual([]) })
  it('prima riga da Open-Meteo', () => { expect(firstExtendedIndex(rows)).toBe(3); expect(firstExtendedIndex([{ source: 'google' }])).toBe(-1) })
  it('normalizeOverview: data e fonte di ore e giorni, con valori di ripiego', () => {
    const v = normalizeOverview({ hourly: [{ time: '2026-11-11T15:00', hour: 15 }, { time: 'x', date: '2026-11-12', source: 'open-meteo' }], daily: [{ date: 'd', source: 'open-meteo' }, { date: 'e' }] })
    expect(v.hourly[0]).toMatchObject({ date: '2026-11-11', source: 'google' })
    expect(v.hourly[1]).toMatchObject({ date: '2026-11-12', source: 'open-meteo' })
    expect(v.daily.map(d => d.source)).toEqual(['open-meteo', 'google'])
  })
})

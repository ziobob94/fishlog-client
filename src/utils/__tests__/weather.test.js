import { describe, it, expect } from 'vitest'
import {
  fmt, fmtSigned, MISSING, compass, windInfo, headingTo, pressureState, moonLabel, hhmm, daylight, dayLabel,
  conditionText, uvLabel, nextTides, tideSummary, normalizeOverview, isPartial, waveSeries, groupHoursByDay, firstExtendedIndex,
  rowWmo, rowLabel, isDayAt, periodSummary, tempBars, readDays, saveDays, DAYS_KEY, reliability, hoursOfDay, dayBands, pressureDay, tidesOfDay, fromNow, hasHourlyDetail, buildHourStream, moonOn, longDate,
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
    const v = normalizeOverview({ marine: { available: true, waves: [{ time: 'a', height: 0.5, period: 4, seaTemp: null }, { time: 'b', height: 'x', period: null }] } })
    expect(v.marine.waves).toEqual([{ time: 'a', height: 0.5, period: 4, seaTemp: null }, { time: 'b', height: null, period: null, seaTemp: null }])
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


const mkDays = n => Array.from({ length: n }, (_, i) => ({
  date: `2026-07-${String(1 + i).padStart(2, '0')}`, tempMin: 15 + i, tempMax: 25 + i, precipSum: i % 2 ? 2 : 0, precipProbability: 20, windSpeed: 10 + i, waveHeightMax: i < 7 ? 0.5 + i / 10 : null,
}))
describe('riepilogo del periodo', () => {
  it('minimi, massimi e totali sui primi n giorni', () => {
    const s7 = periodSummary(mkDays(15), 7)
    expect(s7).toMatchObject({ count: 7, tempMin: 15, tempMax: 31, rainTotal: 6, rainDays: 3, windMax: 16 })
    expect(s7.waveMax).toBeCloseTo(1.1)
    const s15 = periodSummary(mkDays(15), 15)
    expect(s15).toMatchObject({ count: 15, tempMin: 15, tempMax: 39, rainTotal: 14, windMax: 24 })
    expect(s15.waveMax).toBeCloseTo(1.1) // l'onda conta solo i primi 7 giorni
  })
  it('dati mancanti restano null, mai 0, e il totale parziale è segnalato', () => {
    const none = periodSummary([{ date: 'x' }, { date: 'y' }], 7)
    expect(none).toMatchObject({ tempMin: null, tempMax: null, rainTotal: null, rainDays: null, windMax: null, waveMax: null, rainPartial: false })
    const part = periodSummary([{ precipSum: 4 }, { precipSum: null }], 7)
    expect(part.rainTotal).toBe(4); expect(part.rainPartial).toBe(true)
    expect(periodSummary(null, 7).count).toBe(0)
  })
  it('un giorno di pioggia: ≥ 1 mm, oppure probabilità ≥ 50 % se manca la quantità', () => {
    expect(periodSummary([{ precipSum: 0.4 }, { precipSum: 1 }], 7).rainDays).toBe(1)
    expect(periodSummary([{ precipProbability: 60 }, { precipProbability: 40 }], 7).rainDays).toBe(1)
  })
  it('barre min-max in percentuale', () => {
    const b = tempBars([{ tempMin: 10, tempMax: 20 }, { tempMin: 15, tempMax: 30 }, {}], 3)
    expect(b[0]).toEqual({ from: 0, to: 50 }); expect(b[1]).toEqual({ from: 25, to: 100 }); expect(b[2]).toBeNull()
  })
  it('affidabilità: alta fino al 3º giorno, media fino al 7º, bassa oltre', () => {
    expect([0, 2, 3, 6, 7, 14].map(reliability)).toEqual(['high', 'high', 'medium', 'medium', 'low', 'low'])
  })
})

describe('selettore 7 / 15 giorni', () => {
  const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) } }
  it('default 7, si ricorda 15, ignora valori non validi', () => {
    const st = mem()
    expect(readDays(st)).toBe(7)
    saveDays(15, st); expect(st.getItem('fishlog.weather.days')).toBe('15'); expect(DAYS_KEY).toBe('fishlog.weather.days'); expect(readDays(st)).toBe(15)
    saveDays(9, st); expect(readDays(st)).toBe(15)
    st.setItem(DAYS_KEY, 'abc'); expect(readDays(st)).toBe(7)
  })
  it('localStorage che lancia errori non rompe nulla', () => {
    const bad = { getItem() { throw new Error('no') }, setItem() { throw new Error('no') } }
    expect(readDays(bad)).toBe(7); expect(() => saveDays(15, bad)).not.toThrow()
  })
})

describe('icone e testi dalle condizioni', () => {
  it('usa wmo, altrimenti ricava un codice dalla condizione dei dati vecchi', () => {
    expect(rowWmo({ wmo: 61, condition: 'sole' })).toBe(61)
    expect(rowWmo({ condition: 'coperto' })).toBe(3)
    expect(rowWmo({ condition: 'vento' })).toBeNull()
    expect(rowWmo({})).toBeNull()
    expect(rowLabel({ wmo: 0 })).toBe('Sereno'); expect(rowLabel({}, 'Soleggiato')).toBe('Soleggiato'); expect(rowLabel({})).toBe('Non disponibile')
  })
  it('giorno e notte dall\'ora', () => {
    expect(isDayAt(12, '2026-07-01T06:00', '2026-07-01T20:00')).toBe(true)
    expect(isDayAt(23, '2026-07-01T06:00', '2026-07-01T20:00')).toBe(false)
    expect(isDayAt(3, null, null)).toBe(true)
  })
})

describe('dettaglio del giorno', () => {
  const rows = Array.from({ length: 24 }, (_, h) => ({ date: '2026-07-01', hour: h, temp: 10 + h / 2, windSpeed: h, windDeg: 90, precipProbability: h === 13 ? 80 : 10, wmo: 3, pressure: 1010 + Math.abs(h - 12) * 0.5 }))
  it('quattro fasce con media, massimo e null se manca il dato', () => {
    const b = dayBands(rows, [{ time: '2026-07-01T08:00', height: 1 }, { time: '2026-07-01T09:00', height: 2 }])
    expect(b.map(x => x.key)).toEqual(['night', 'morning', 'afternoon', 'evening'])
    expect(b[2]).toMatchObject({ rain: 80, wind: 17 })
    expect(b[1].wave).toBe(1.5); expect(b[0].wave).toBeNull()
    expect(dayBands([], [])[0]).toMatchObject({ temp: null, wind: null, rain: null, wave: null })
  })
  it('pressione: minimo con ora e forma «in calo, poi in aumento»', () => {
    const p = pressureDay(rows)
    expect(p.minHour).toBe(12); expect(p.min).toBe(1010); expect(p.shape).toBe('fallRise')
    expect(pressureDay(rows.slice(0, 3))).toBeNull()
    expect(pressureDay(rows.map(r => ({ ...r, pressure: null })))).toBeNull()
  })
  it('ore, maree e dettaglio disponibili solo entro 7 giorni', () => {
    const view = { daily: mkDays(10), hourly: [...rows, ...rows.map(r => ({ ...r, date: '2026-07-09' }))] }
    expect(hoursOfDay(view, '2026-07-01')).toHaveLength(24)
    expect(hasHourlyDetail(view, '2026-07-01')).toBe(true)
    expect(hasHourlyDetail(view, '2026-07-09')).toBe(false) // oltre 7 giorni: niente dettaglio anche se ci sono ore
    expect(hasHourlyDetail(view, '2026-08-30')).toBe(false)
    const marine = { tides: { series: Array.from({ length: 30 }, (_, i) => ({ time: `2026-07-01T${String(i % 24).padStart(2, '0')}:00`, height: i })), extremes: [{ time: '2026-07-01T06:00', type: 'alta', height: 1 }, { time: '2026-07-02T06:00', type: 'alta', height: 1 }] } }
    expect(tidesOfDay(marine, '2026-07-01').extremes).toHaveLength(1)
    expect(tidesOfDay({ tides: null }, '2026-07-01')).toBeNull()
  })
  it('fromNow tiene 48 ore a partire da adesso', () => {
    const s = Array.from({ length: 168 }, (_, i) => ({ time: `2026-07-${String(1 + Math.floor(i / 24)).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00` }))
    const r = fromNow(s, '2026-07-01T10:30', 48)
    expect(r).toHaveLength(48); expect(r[0].time).toBe('2026-07-01T10:00')
  })
  it('luna e data lunga', () => {
    expect(moonOn('2000-01-06').phase).toBe('luna_nuova'); expect(moonOn('nope').phase).toBeNull()
    expect(longDate('2026-11-13')).toBe('Venerdì 13 novembre'); expect(longDate('x')).toBe('—')
  })
})

describe('normalizeOverview: campi nuovi', () => {
  it('mancanti → null, attività solo se ha un livello', () => {
    const v = normalizeOverview({ daily: [{ date: '2026-07-01', wmo: 61, activity: { level: 4, label: 'Buona', score: 0.7 } }, { date: '2026-07-02', activity: null }], hourly: [{ date: '2026-07-01', hour: 1 }] })
    expect(v.daily[0]).toMatchObject({ wmo: 61, precipSum: null, windGust: null, activity: { level: 4, label: 'Buona' } })
    expect(v.daily[1].activity).toBeNull(); expect(v.daily[1].wmo).toBeNull()
    expect(v.hourly[0]).toMatchObject({ pressure: null, precipMm: null, wmo: null })
  })
})

describe('striscia oraria continua', () => {
  const hr = (date, hour) => ({ date, hour, time: `${date}T${String(hour).padStart(2, '0')}:00` })
  const view = {
    hourly: [hr('2026-11-11', 22), hr('2026-11-11', 23), hr('2026-11-12', 0), hr('2026-11-12', 1), hr('2026-11-12', 6), hr('2026-11-12', 7)],
    daily: [{ date: '2026-11-12', sunrise: '2026-11-12T06:48', sunset: '2026-11-12T16:55' }],
  }
  it('divisori di giorno e alba come marcatore sull\'ora giusta', () => {
    const st = buildHourStream(view, 48)
    expect(st.map(x => x.type === 'hour' ? x.row.hour : x.type)).toEqual(['day', 22, 23, 'day', 0, 1, 6, 7])
    expect(st.find(x => x.row?.hour === 6).sun).toMatchObject({ type: 'sunrise', time: '06:48', frac: 0.8 })
  })
  it('limita a n ore e il dettaglio di oggi resta con poche ore', () => {
    expect(buildHourStream(view, 2).filter(x => x.type === 'hour')).toHaveLength(2)
    const v = { daily: [{ date: '2026-11-11' }], hourly: [hr('2026-11-11', 20), hr('2026-11-11', 21), hr('2026-11-11', 22), hr('2026-11-11', 23)] }
    expect(hasHourlyDetail(v, '2026-11-11')).toBe(true)
  })
})

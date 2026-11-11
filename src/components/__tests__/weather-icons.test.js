import { describe, it, expect } from 'vitest'
import { wmoToIcon, wmoLabel, weatherIcons, weatherLabels } from '../weather-icons.js'

describe('wmoToIcon', () => {
  it.each([[0, true, 'sereno'], [0, false, 'sereno-notte'], [1, true, 'sereno'], [2, true, 'poco-nuvoloso'], [2, false, 'poco-nuvoloso-notte'],
    [3, true, 'coperto'], [45, true, 'nebbia'], [48, true, 'nebbia'], [53, true, 'pioggerella'], [61, true, 'pioggia'], [65, true, 'pioggia-forte'],
    [73, true, 'neve'], [81, true, 'rovescio'], [95, true, 'temporale'], [99, true, 'temporale-grandine']])('%i (giorno=%s) → %s', (code, day, icon) => {
    expect(wmoToIcon(code, day)).toBe(icon)
  })
  it('codice sconosciuto o mancante → nuvoloso, mai un\'icona vistosa', () => {
    for (const c of [null, undefined, 1234, NaN]) expect(wmoToIcon(c)).toBe('nuvoloso')
  })
  it('ogni icona restituita esiste ed ha un\'etichetta', () => {
    for (const code of [0, 1, 2, 3, 45, 51, 56, 61, 63, 65, 66, 71, 77, 80, 82, 85, 95, 96, 99, 7]) for (const day of [true, false]) {
      const k = wmoToIcon(code, day); expect(weatherIcons[k]).toBeTruthy(); expect(weatherLabels[k]).toBeTruthy()
    }
  })
})
describe('wmoLabel', () => {
  it.each([[0, 'Sereno'], [2, 'Poco nuvoloso'], [3, 'Coperto'], [45, 'Nebbia'], [61, 'Pioggia debole'], [65, 'Pioggia forte'], [95, 'Temporale'], [99, 'Temporale con grandine']])('%i → %s', (c, l) => expect(wmoLabel(c)).toBe(l))
  it('codice sconosciuto → «Non disponibile»', () => { expect(wmoLabel(null)).toBe('Non disponibile'); expect(wmoLabel(42)).toBe('Non disponibile') })
})

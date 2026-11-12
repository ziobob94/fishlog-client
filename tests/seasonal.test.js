import { describe, it, expect } from 'vitest'
import { bestRanges, seasonAlt, monthName } from '../src/utils/seasonal.js'

describe('seasonal', () => {
  const s = [0.2, 0.2, 0.3, 0.5, 0.7, 0.9, 1, 1, 0.9, 0.8, 0.5, 0.3]
  it('intervallo dei mesi migliori', () => expect(bestRanges(s)).toEqual(['giugno–ottobre']))
  it('passaggio d\'anno', () => expect(bestRanges([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])).toEqual(['dicembre–febbraio']))
  it('tutto l\'anno e mai', () => { expect(bestRanges(Array(12).fill(1))).toEqual(["tutto l'anno"]); expect(bestRanges(Array(12).fill(0.1))).toEqual([]) })
  it('testo alternativo', () => expect(seasonAlt('Orata', s, 7, 'Molto probabile')).toBe('Orata: Molto probabile a luglio. Periodo migliore: giugno–ottobre.'))
  it('nome mese', () => expect(monthName(1)).toBe('gennaio'))
})

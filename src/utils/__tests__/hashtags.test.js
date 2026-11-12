import { describe, it, expect } from 'vitest'
import { splitHashtags } from '../hashtags.js'

describe('splitHashtags', () => {
  it('separa testo e tag, normalizzando il tag', () => {
    expect(splitHashtags('Ciao #Spigola!')).toEqual([{ text: 'Ciao ' }, { text: '#Spigola', tag: 'spigola' }, { text: '!' }])
  })
  it('non trasforma url con ancora, a#b o numeri', () => {
    expect(splitHashtags('x.it/a#b a#b #123')).toEqual([{ text: 'x.it/a#b a#b #123' }])
  })
  it('testo vuoto', () => { expect(splitHashtags('')).toEqual([]) })
})

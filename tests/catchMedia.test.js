import { describe, it, expect } from 'vitest'
import { coverOf, visibleMedia, slideIndexAt, isAuthor } from '../src/utils/catchMedia.js'

describe('catchMedia', () => {
  it('copertina: prima foto, altrimenti primo video, altrimenti null', () => {
    expect(coverOf([{ url: 'v', type: 'video' }, { url: 'p', type: 'photo' }]).url).toBe('p')
    expect(coverOf([{ url: 'v', type: 'video' }]).url).toBe('v')
    expect(coverOf([])).toBeNull()
    expect(coverOf(undefined)).toBeNull()
  })
  it('ignora elementi senza url', () => {
    expect(visibleMedia([{ type: 'photo' }, { url: 'a' }, null])).toHaveLength(1)
  })
  it('indice della diapositiva è limitato a 0..n-1', () => {
    expect(slideIndexAt(0, 300, 3)).toBe(0)
    expect(slideIndexAt(310, 300, 3)).toBe(1)
    expect(slideIndexAt(9999, 300, 3)).toBe(2)
    expect(slideIndexAt(100, 0, 3)).toBe(0)
  })
  it('solo l\'autore ha il cestino', () => {
    expect(isAuthor({ userId: 'u1' }, 'u1')).toBe(true)
    expect(isAuthor({ userId: { _id: 'u1' } }, 'u2')).toBe(false)
    expect(isAuthor({ _pending: true, userId: 'x' }, 'u2')).toBe(true)
    expect(isAuthor(null, 'u1')).toBe(false)
  })
})

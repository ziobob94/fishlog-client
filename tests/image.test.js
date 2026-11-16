import { describe, it, expect } from 'vitest'
import { compressImage } from '../src/utils/image.js'

describe('compressImage', () => {
  it('lascia invariati i file non immagine', async () => {
    const f = new File(['x'], 'a.mp4', { type: 'video/mp4' })
    expect(await compressImage(f)).toBe(f)
  })
  it('lascia invariati GIF e SVG', async () => {
    const g = new File(['x'], 'a.gif', { type: 'image/gif' })
    expect(await compressImage(g)).toBe(g)
  })
  it('ricade sul file originale se il browser non sa decodificarlo', async () => {
    const f = new File(['non-un-immagine'], 'a.heic', { type: 'image/heic' })
    expect(await compressImage(f)).toBe(f)
  })
})

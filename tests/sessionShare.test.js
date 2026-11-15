import { describe, it, expect, vi, afterEach } from 'vitest'
import { nativeShare } from '../src/utils/sessionShare.js'

afterEach(() => vi.unstubAllGlobals())

describe('nativeShare', () => {
  it('senza Web Share API è unsupported', async () => {
    vi.stubGlobal('navigator', {})
    expect(await nativeShare({ url: 'u' })).toBe('unsupported')
  })
  it('annullamento dell\'utente non è un errore', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })) })
    expect(await nativeShare({ url: 'u' })).toBe('cancelled')
  })
  it('condivisione riuscita', async () => {
    const share = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { share })
    expect(await nativeShare({ title: 't', url: 'u' })).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }))
vi.mock('../../utils/api.js', () => ({ default: api }))

import { useFavoritesStore } from '../favorites.js'
import { MAX_FAVORITES } from '../../utils/favorites.js'

const spot = (i, extra = {}) => ({ id: `p${i}`, name: `Posto ${i}`, lat: 40 + i, lon: 10 + i, ...extra })
const memStorage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) } }

let server
beforeEach(() => {
  vi.stubGlobal('localStorage', memStorage())
  vi.stubGlobal('navigator', { onLine: true })
  setActivePinia(createPinia())
  server = []
  api.get.mockReset().mockImplementation(async () => ({ data: { places: server } }))
  api.put.mockReset().mockImplementation(async (_u, body) => { server = body.places.map((p, i) => ({ ...p, order: i })); return { data: { places: server } } })
  api.post.mockReset()
})

describe('ordine', () => {
  it('move riordina e rinumera, e invia la lista intera', async () => {
    const s = useFavoritesStore()
    for (const i of [1, 2, 3]) await s.add(spot(i))
    expect(await s.move(0, 2)).toBe('ok')
    expect(s.places.map(p => [p.id, p.order])).toEqual([['p2', 0], ['p3', 1], ['p1', 2]])
    expect(api.put.mock.lastCall[1].places.map(p => p.id)).toEqual(['p2', 'p3', 'p1'])
  })
  it('spostamenti fuori dai limiti non cambiano nulla', async () => {
    const s = useFavoritesStore(); await s.add(spot(1)); await s.add(spot(2))
    api.put.mockClear()
    await s.move(0, 5); await s.move(1, 1)
    expect(api.put).toHaveBeenCalledTimes(2)
    expect(s.places.map(p => p.id)).toEqual(['p1', 'p2'])
  })
})

describe('limite di 8', () => {
  it('la nona è rifiutata senza chiamare il server', async () => {
    const s = useFavoritesStore()
    for (let i = 0; i < MAX_FAVORITES; i++) expect(await s.add(spot(i))).toBe('ok')
    expect(s.limitReached).toBe(true)
    api.put.mockClear()
    expect(await s.add(spot(99))).toBe('limit')
    expect(s.count).toBe(8); expect(api.put).not.toHaveBeenCalled()
  })
  it('lo stesso posto non si aggiunge due volte; toggle lo toglie', async () => {
    const s = useFavoritesStore(); await s.add(spot(1))
    expect(await s.add(spot(7, { lat: 41.0004, lon: 11.0004 }))).toBe('duplicate')
    expect(await s.toggle({ lat: 41, lon: 11 })).toBe('removed')
    expect(s.count).toBe(0)
  })
})

describe('annulla rimozione', () => {
  it('rimette la scheda nella posizione di prima', async () => {
    const s = useFavoritesStore(); for (const i of [1, 2, 3]) await s.add(spot(i))
    const r = await s.remove('p2')
    expect(r.status).toBe('ok'); expect(s.places.map(p => p.id)).toEqual(['p1', 'p3'])
    expect(await s.undoRemove(r.removed, r.index)).toBe('ok')
    expect(s.places.map(p => [p.id, p.order])).toEqual([['p1', 0], ['p2', 1], ['p3', 2]])
    expect(server.map(p => p.id)).toEqual(['p1', 'p2', 'p3'])
  })
  it('se la richiesta fallisce la lista torna com\'era', async () => {
    const s = useFavoritesStore(); await s.add(spot(1))
    api.put.mockRejectedValueOnce(new Error('boom'))
    expect((await s.remove('p1')).status).toBe('error')
    expect(s.places.map(p => p.id)).toEqual(['p1'])
  })
})

describe('offline', () => {
  it('senza rete la lista viene dalla cache locale, in sola lettura', async () => {
    const s1 = useFavoritesStore(); await s1.add(spot(1)); await s1.add(spot(2))
    setActivePinia(createPinia())
    api.get.mockRejectedValue(new Error('Network Error'))
    const s = useFavoritesStore(); await s.load()
    expect(s.places.map(p => p.id)).toEqual(['p1', 'p2']); expect(s.readOnly).toBe(true)
    navigator.onLine = false
    api.put.mockClear()
    expect(await s.add(spot(3))).toBe('offline')
    expect((await s.remove('p1')).status).toBe('offline')
    expect(s.count).toBe(2); expect(api.put).not.toHaveBeenCalled()
  })
  it('schede: offline restano i dati salvati con la loro ora; online una sola chiamata batch', async () => {
    const s = useFavoritesStore(); await s.add(spot(1)); await s.add(spot(2))
    api.post.mockResolvedValue({ data: { results: [{ id: 'p1', ok: true, temp: 20, hasSea: true, waveHeight: 0.5 }, { id: 'p2', ok: false }] } })
    await s.loadCards()
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post.mock.calls[0][1].places.map(p => p.id)).toEqual(['p1', 'p2'])
    expect(s.cards.p1.temp).toBe(20); expect(s.cards.p2.ok).toBe(false)
    const at = s.cards.p1.savedAt
    navigator.onLine = false
    await s.loadCards({ force: true })
    expect(s.cardsStatus).toBe('offline'); expect(s.cards.p1.temp).toBe(20); expect(s.cards.p1.savedAt).toBe(at)
  })
  it('cache 15 min: nessuna nuova chiamata se i dati sono recenti', async () => {
    const s = useFavoritesStore(); await s.add(spot(1))
    api.post.mockResolvedValue({ data: { results: [{ id: 'p1', ok: true, temp: 20 }] } })
    await s.loadCards(); await s.loadCards()
    expect(api.post).toHaveBeenCalledTimes(1)
    await s.loadCards({ force: true })
    expect(api.post).toHaveBeenCalledTimes(2)
  })
})

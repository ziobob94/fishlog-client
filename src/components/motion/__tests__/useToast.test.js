import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToast, toastState, pause, resume } from '../useToast.js'

describe('useToast', () => {
  beforeEach(() => { vi.useFakeTimers(); toastState.items = [] })
  afterEach(() => { vi.useRealTimers() })

  it.each([['success', 4000], ['info', 4000], ['warning', 6000], ['error', 8000]])('%s dura %i ms', (kind, ms) => {
    useToast()[kind]('x')
    vi.advanceTimersByTime(ms - 1)
    expect(toastState.items).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toastState.items).toHaveLength(0)
  })

  it('persist non scade mai', () => {
    useToast().error('x', { persist: true })
    vi.advanceTimersByTime(60000)
    expect(toastState.items).toHaveLength(1)
  })

  it('in pausa non scade e riprende col tempo rimasto', () => {
    useToast().success('x')
    const t = toastState.items[0]
    vi.advanceTimersByTime(3000)
    pause(t)
    vi.advanceTimersByTime(10000)
    expect(toastState.items).toHaveLength(1)
    resume(t)
    vi.advanceTimersByTime(999)
    expect(toastState.items).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toastState.items).toHaveLength(0)
  })

  it('al massimo 3 alla volta e i toast con azione vanno in basso', () => {
    const toast = useToast()
    for (let i = 0; i < 5; i++) toast.info('m' + i)
    expect(toastState.items.map(t => t.message)).toEqual(['m2', 'm3', 'm4'])
    toast.success('Annulla?', { action: { label: 'Annulla', onClick() {} } })
    expect(toastState.items.at(-1).position).toBe('bottom')
  })
})

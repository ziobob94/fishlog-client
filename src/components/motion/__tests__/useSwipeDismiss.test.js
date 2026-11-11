import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import { useSwipeDismiss } from '../motion.js'

// Ambiente node: finto elemento e finte variabili CSS (200 ms per --motion-base).
function setup(extra = {}) {
  vi.useFakeTimers()
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '200ms' })
  globalThis.document = { documentElement: {} }
  const el = ref({ style: {}, getBoundingClientRect: () => ({ height: 400 }), setPointerCapture() {} })
  const onDismiss = vi.fn()
  const { handlers, dragging } = useSwipeDismiss(el, { onDismiss, ...extra })
  const ev = (y, t) => ({ clientY: y, timeStamp: t, pointerId: 1, target: {} })
  return { el, onDismiss, handlers, dragging, ev }
}

describe('useSwipeDismiss', () => {
  afterEach(() => { vi.useRealTimers() })

  it('chiude oltre il 25 % dell\'altezza (anche lenti)', () => {
    const { handlers, ev, onDismiss } = setup()
    handlers.onPointerdown(ev(0, 0))
    handlers.onPointermove(ev(101, 2000))   // 101 px su 400 = 25,25 %, 0,05 px/ms
    handlers.onPointerup(ev(101, 2000))
    vi.advanceTimersByTime(200)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('sotto il 25 % e sotto 0,5 px/ms torna su', () => {
    const { handlers, ev, onDismiss, el } = setup()
    handlers.onPointerdown(ev(0, 0))
    handlers.onPointermove(ev(99, 2000))    // 24,75 %, 0,05 px/ms
    handlers.onPointerup(ev(99, 2000))
    vi.advanceTimersByTime(400)
    expect(onDismiss).not.toHaveBeenCalled()
    expect(el.value.style.transform).toBe('')
  })

  it('chiude con un colpo veloce (> 0,5 px/ms) anche se corto', () => {
    const { handlers, ev, onDismiss } = setup()
    handlers.onPointerdown(ev(0, 0))
    handlers.onPointermove(ev(20, 10))      // 2 px/ms per 20 px (5 %)
    handlers.onPointerup(ev(20, 10))
    vi.advanceTimersByTime(200)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('un colpo lento di 0,4 px/ms non chiude', () => {
    const { handlers, ev, onDismiss } = setup()
    handlers.onPointerdown(ev(0, 0))
    handlers.onPointermove(ev(40, 100))     // 0,4 px/ms, 10 %
    handlers.onPointerup(ev(40, 100))
    vi.advanceTimersByTime(400)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('non parte se il contenuto scorrevole non è in cima', () => {
    const scrollEl = ref({ contains: () => true, scrollTop: 30 })
    const { handlers, ev, dragging, onDismiss } = setup({ scrollEl })
    handlers.onPointerdown(ev(0, 0))
    handlers.onPointermove(ev(300, 10))
    handlers.onPointerup(ev(300, 10))
    expect(dragging.value).toBe(false)
    expect(onDismiss).not.toHaveBeenCalled()
  })
})

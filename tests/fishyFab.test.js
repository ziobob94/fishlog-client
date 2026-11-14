import { describe, it, expect } from 'vitest'
import { fabState, EXPRESSION, queuedCount, badgeLabel, nextBlinkMs, formatElapsed, isCancelZone, CANCEL_DX } from '../src/utils/fishyFab.js'

describe('stati del pulsante di Fishy', () => {
  it('a riposo e alla prima apparizione', () => {
    expect(fabState({})).toBe('idle')
    expect(fabState({ introLeft: 2 })).toBe('first')
  })
  it('ascolto ed elaborazione hanno la precedenza sugli avvisi', () => {
    expect(fabState({ listening: true, error: true, queued: 3 })).toBe('listening')
    expect(fabState({ busy: true, success: true })).toBe('busy')
  })
  it('errore, successo, limite e offline', () => {
    expect(fabState({ error: true, queued: 1 })).toBe('error')
    expect(fabState({ success: true, limit: true })).toBe('success')
    expect(fabState({ limit: true, queued: 2, introLeft: 3 })).toBe('limit')
    expect(fabState({ offline: true })).toBe('offline')
    expect(fabState({ queued: 1, introLeft: 3 })).toBe('offline')
  })
  it('ogni stato ha un\'espressione', () => {
    for (const s of ['idle', 'first', 'listening', 'busy', 'success', 'error', 'offline', 'limit']) expect(EXPRESSION[s]).toBeTruthy()
    expect(EXPRESSION.busy).toBe('think')
  })
  it('ammicco ogni 20–30 s e timer m:ss', () => {
    expect(nextBlinkMs(() => 0)).toBe(20000)
    expect(nextBlinkMs(() => 1)).toBe(30000)
    expect(formatElapsed(65000)).toBe('1:05')
    expect(formatElapsed(-5)).toBe('0:00')
  })
  it('zona di annullo a sinistra', () => {
    expect(isCancelZone(200, 200 - CANCEL_DX)).toBe(true)
    expect(isCancelZone(200, 190)).toBe(false)
    expect(isCancelZone(200, 260)).toBe(false)
  })
})

describe('coda offline di Fishy', () => {
  const outbox = [
    { meta: { kind: 'assistant' } }, { meta: { kind: 'voice-catch' } }, { meta: { kind: 'session-create' } }, { meta: {} }
  ]
  it('conta solo le richieste per Fishy', () => { expect(queuedCount(outbox)).toBe(2); expect(queuedCount()).toBe(0) })
  it('il badge mostra il numero, 9+ oltre le nove', () => {
    expect(badgeLabel(0)).toBe(''); expect(badgeLabel(3)).toBe('3'); expect(badgeLabel(12)).toBe('9+')
  })
  it('con richieste in coda il pulsante è «offline» anche se la rete è tornata', () => {
    expect(fabState({ queued: queuedCount(outbox), offline: false })).toBe('offline')
  })
})

import { readFileSync } from 'node:fs'
import { animState, OK_MS } from '../src/utils/fishyFab.js'

describe('pesce animato del pulsante', () => {
  it('mappa gli stati del pulsante su idle · listen · think · ok', () => {
    expect(animState('idle')).toBe('idle')
    expect(animState('first')).toBe('idle')
    expect(animState('listening')).toBe('listen')
    expect(animState('busy')).toBe('think')
    expect(animState('success')).toBe('ok')
  })
  it('errore, offline e limite restano le espressioni ferme', () => {
    for (const s of ['error', 'offline', 'limit']) expect(animState(s)).toBeNull()
  })
  it('dopo il successo torna a idle (una sola volta, ~0,7 s)', () => {
    expect(OK_MS).toBe(700)
    expect(animState('success', true)).toBe('idle')
    expect(animState('listening', true)).toBe('listen')
  })
})

describe('FishyAnimated: movimento ridotto e accessibilità', () => {
  const src = readFileSync(new URL('../src/components/FishyAnimated.vue', import.meta.url), 'utf8')
  it('è decorativo', () => { expect(src).toContain('aria-hidden="true"') })
  it('spegne ogni animazione con prefers-reduced-motion e con data-motion=reduce', () => {
    expect(src).toMatch(/prefers-reduced-motion: reduce\)[^}]*\{\s*:root:not\(\[data-motion='full'\]\) \.fa \* \{ animation: none !important/)
    expect(src).toContain(":root[data-motion='reduce'] .fa * { animation: none !important")
  })
  it('usa le durate del design', () => {
    for (const d of ['5s', '2.8s', '4s', '.9s', '1.2s', '.55s', '2.4s', '.2s', '.7s', '.4s']) expect(src).toContain(d)
  })
  it('onde e bocca non leggono alcun livello audio', () => { expect(src).not.toMatch(/AudioContext|analyser|getUserMedia|volume/i) })
})

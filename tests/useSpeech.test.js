import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Riconoscitore finto: registra start/stop e permette di simulare risultati e fine ascolto.
let instances
class FakeRec {
  constructor() { instances.push(this); this.started = false }
  start() { this.started = true }
  stop() { this.started = false; queueMicrotask(() => this.onend?.()) }
  abort() { this.started = false }
  say(text, isFinal = true) { this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal })] }) }
}

async function load(ua = 'Mozilla/5.0 (Linux; Android 14) Chrome/120') {
  vi.resetModules()
  vi.stubGlobal('window', { webkitSpeechRecognition: FakeRec })
  vi.stubGlobal('navigator', { userAgent: ua, platform: 'Linux', maxTouchPoints: 5 })
  return import('../src/composables/useSpeech.js')
}

describe('useSpeech', () => {
  beforeEach(() => { instances = []; vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('tocca per iniziare, tocca per inviare: start poi stop consegna il testo', async () => {
    const { useSpeech } = await load()
    const onResult = vi.fn()
    const s = useSpeech({ onResult })
    s.start()
    expect(s.listening.value).toBe(true)
    instances[0].say('ho preso una spigola')
    s.stop()
    await vi.advanceTimersByTimeAsync(0)
    expect(onResult).toHaveBeenCalledWith('ho preso una spigola')
    expect(s.listening.value).toBe(false)
  })

  it('si ferma da solo dopo il silenzio e invia', async () => {
    const { useSpeech } = await load()
    const onResult = vi.fn()
    const s = useSpeech({ onResult, silenceMs: 3000 })
    s.start(); instances[0].say('una orata')
    await vi.advanceTimersByTimeAsync(3100)
    expect(onResult).toHaveBeenCalledWith('una orata')
  })

  it('senza parlare si chiude dopo idleMs e non invia nulla', async () => {
    const { useSpeech } = await load()
    const onResult = vi.fn()
    const s = useSpeech({ onResult, idleMs: 5000 })
    s.start()
    await vi.advanceTimersByTimeAsync(5100)
    expect(s.listening.value).toBe(false)
    expect(onResult).not.toHaveBeenCalled()
  })

  it('su iPhone la modalità continua è spenta, altrove accesa', async () => {
    let m = await load('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari')
    m.useSpeech({}).start(); expect(instances[0].continuous).toBe(false)
    instances = []
    m = await load()
    m.useSpeech({}).start(); expect(instances[0].continuous).toBe(true)
  })

  it('errore del permesso viene segnalato; no-speech no', async () => {
    const { useSpeech } = await load()
    const onError = vi.fn()
    const s = useSpeech({ onError })
    s.start(); instances[0].onerror({ error: 'not-allowed' })
    expect(onError).toHaveBeenCalledWith('not-allowed')
    s.start(); instances[1].onerror({ error: 'no-speech' })
    expect(onError).toHaveBeenCalledTimes(1)
  })
})

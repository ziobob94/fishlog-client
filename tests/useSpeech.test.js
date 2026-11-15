import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Riconoscitore finto: registra start/stop e permette di simulare risultati e fine ascolto.
let instances
class FakeRec {
  constructor() { instances.push(this); this.started = false }
  start() { this.started = true }
  stop() { this.started = false; queueMicrotask(() => this.onend?.()) }
  abort() { this.started = false }
  sayAll(list) { this.onresult?.({ resultIndex: 0, results: list.map(([text, isFinal]) => Object.assign([{ transcript: text }], { isFinal })) }) }
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

  it('cancel chiude l\'ascolto senza inviare la frase', async () => {
    const { useSpeech } = await load()
    const onResult = vi.fn()
    const s = useSpeech({ onResult })
    s.start(); instances[0].say('ho preso una spigola')
    s.cancel()
    instances[0].onend?.()
    expect(s.listening.value).toBe(false)
    expect(onResult).not.toHaveBeenCalled()
  })

  it('Android: segmenti cumulativi non vengono ripetuti', async () => {
    const { useSpeech } = await load()
    const onResult = vi.fn()
    const s = useSpeech({ onResult })
    s.start()
    const r = instances[0]
    r.sayAll([['inizia', true]])
    r.sayAll([['inizia', true], ['inizia una', true]])
    r.sayAll([['inizia', true], ['inizia una', true], ['inizia una sessione di pesca', true]])
    expect(s.interim.value).toBe('inizia una sessione di pesca')
    s.stop()
    await vi.advanceTimersByTimeAsync(0)
    expect(onResult).toHaveBeenCalledWith('inizia una sessione di pesca')
  })

  it('parziali sostituiti, finali concatenati', async () => {
    const { useSpeech } = await load()
    const onResult = vi.fn()
    const s = useSpeech({ onResult })
    s.start()
    const r = instances[0]
    r.sayAll([['ho preso', false]])
    r.sayAll([['ho preso una spigola', true], ['e una', false]])
    r.sayAll([['ho preso una spigola', true], ['e una orata', true]])
    s.stop()
    await vi.advanceTimersByTimeAsync(0)
    expect(onResult).toHaveBeenCalledWith('ho preso una spigola e una orata')
  })

  it('un errore dopo una trascrizione valida non viene segnalato', async () => {
    const { useSpeech } = await load()
    const onError = vi.fn(), onResult = vi.fn()
    const s = useSpeech({ onResult, onError })
    s.start(); instances[0].say('una orata')
    instances[0].onerror({ error: 'network' }); instances[0].onend()
    expect(onError).not.toHaveBeenCalled()
    expect(onResult).toHaveBeenCalledWith('una orata')
  })
})

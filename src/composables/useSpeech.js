import { ref, getCurrentInstance, onBeforeUnmount } from 'vue'

// Riconoscimento vocale del dispositivo (Web Speech API: Chrome/Android, Safari/iOS recente).
// start() avvia l'ascolto, stop() lo chiude e il testo finale arriva in onResult. Si ferma anche da solo dopo un
// silenzio (`silenceMs` dall'ultima parola, `idleMs` se non si parla affatto): è ciò che permette la modalità
// «tocca per parlare, tocca per inviare» su telefono, dove tenere premuto non è affidabile.
// Dove l'API non esiste `supported` è false e il chiamante offre l'inserimento a tastiera.
export const isIOS = () => typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export function useSpeech({ lang = 'it-IT', onResult, onError, silenceMs = 3500, idleMs = 10000 } = {}) {
  const Ctor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
  const supported = !!Ctor
  const listening = ref(false)
  const interim = ref('')
  let rec = null
  let finalText = ''
  let timer = null
  let cancelled = false

  const clearTimer = () => { clearTimeout(timer); timer = null }
  const arm = ms => { clearTimer(); if (ms > 0) timer = setTimeout(stop, ms) }

  function start() {
    if (!supported || listening.value) return
    finalText = ''; interim.value = ''; cancelled = false
    rec = new Ctor()
    rec.lang = lang
    rec.interimResults = true
    // Su iOS la modalità continua è inaffidabile: lì basta una frase (si chiude da sola alla pausa).
    rec.continuous = !isIOS()
    rec.onresult = (e) => {
      let tmp = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript + ' '
        else tmp += r[0].transcript
      }
      interim.value = (finalText + tmp).trim()
      arm(silenceMs)
    }
    rec.onerror = (e) => { clearTimer(); listening.value = false; if (e.error !== 'no-speech' && e.error !== 'aborted') onError?.(e.error) }
    rec.onend = () => {
      clearTimer()
      listening.value = false
      const text = (finalText || interim.value).trim()
      interim.value = ''
      if (text && !cancelled) onResult?.(text)
    }
    try { rec.start(); listening.value = true; arm(idleMs) } catch { listening.value = false }
  }
  // Chiude l'ascolto senza inviare nulla (zona di annullo del tieni-premuto).
  function cancel() { cancelled = true; clearTimer(); try { rec?.abort() } catch { /* */ }; listening.value = false; interim.value = '' }
  function stop() { clearTimer(); try { rec?.stop() } catch { /* già fermo */ } }
  if (getCurrentInstance()) onBeforeUnmount(() => { clearTimer(); try { rec?.abort() } catch { /* */ } })

  return { supported, listening, interim, start, stop, cancel }
}

import { ref, onBeforeUnmount } from 'vue'

// Riconoscimento vocale del dispositivo (Web Speech API: Chrome/Android, Safari/iOS recente).
// Tieni-premuto: start() all'inizio della pressione, stop() al rilascio; il testo finale arriva in onResult.
// Dove l'API non esiste `supported` è false e il chiamante offre l'inserimento a tastiera.
export function useSpeech({ lang = 'it-IT', onResult, onError } = {}) {
  const Ctor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
  const supported = !!Ctor
  const listening = ref(false)
  const interim = ref('')
  let rec = null
  let finalText = ''

  function start() {
    if (!supported || listening.value) return
    finalText = ''; interim.value = ''
    rec = new Ctor()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = true // non chiudere alla prima pausa mentre il pulsante è premuto
    rec.onresult = (e) => {
      let tmp = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript + ' '
        else tmp += r[0].transcript
      }
      interim.value = (finalText + tmp).trim()
    }
    rec.onerror = (e) => { listening.value = false; if (e.error !== 'no-speech' && e.error !== 'aborted') onError?.(e.error) }
    rec.onend = () => {
      listening.value = false
      const text = (finalText || interim.value).trim()
      interim.value = ''
      if (text) onResult?.(text)
    }
    try { rec.start(); listening.value = true } catch { listening.value = false }
  }
  function stop() { try { rec?.stop() } catch { /* già fermo */ } }
  onBeforeUnmount(() => { try { rec?.abort() } catch { /* */ } })

  return { supported, listening, interim, start, stop }
}

import { ref, getCurrentInstance, onBeforeUnmount } from 'vue'

// Riconoscimento vocale del dispositivo (Web Speech API: Chrome/Android, Safari/iOS recente).
// start() avvia l'ascolto, stop() lo chiude e il testo finale arriva in onResult. Si ferma anche da solo dopo un
// silenzio (`silenceMs` dall'ultima parola, `idleMs` se non si parla affatto): è ciò che permette la modalità
// «tocca per parlare, tocca per inviare» su telefono, dove tenere premuto non è affidabile.
// Dove l'API non esiste `supported` è false e il chiamante offre l'inserimento a tastiera.
export const isIOS = () => typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

// Unisce i segmenti del riconoscitore evitando ripetizioni: se un segmento riprende quello precedente (aggiornamento
// cumulativo di Android) lo sostituisce, se è già contenuto lo ignora, altrimenti lo accoda.
export function mergeSegments(parts) {
  const out = []
  for (const raw of parts) {
    const seg = raw.trim()
    if (!seg) continue
    const prev = out[out.length - 1]
    if (prev !== undefined) {
      const a = prev.toLowerCase(), b = seg.toLowerCase()
      if (b.startsWith(a)) { out[out.length - 1] = seg; continue }
      if (a.startsWith(b)) continue
    }
    out.push(seg)
  }
  return out.join(' ')
}

// iOS (Safari e PWA) richiede di nuovo il permesso del microfono a ogni nuova sessione di riconoscimento. Finché il foglio di
// Fishy è aperto teniamo quindi UN solo flusso audio già autorizzato (si chiede una volta, non a ogni frase) e lo
// rilasciamo alla chiusura del foglio o quando l'app va in background. Solo iOS; si spegne con localStorage fishy.keepMic = 'off'.
let keepStream = null
let keepPending = null
export async function holdMic() {
  try {
    if (!isIOS() || keepStream || keepPending || localStorage.getItem('fishy.keepMic') === 'off') return
    if (!navigator.mediaDevices?.getUserMedia) return
    keepPending = navigator.mediaDevices.getUserMedia({ audio: true })
    keepStream = await keepPending
  } catch { keepStream = null /* negato o non disponibile: si va avanti come prima */ } finally { keepPending = null }
}
export function releaseMic() {
  try { keepStream?.getTracks().forEach(t => t.stop()) } catch { /* */ }
  keepStream = null
}

export function useSpeech({ lang = 'it-IT', onResult, onError, silenceMs = 3500, idleMs = 10000 } = {}) {
  const Ctor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
  const supported = !!Ctor
  const listening = ref(false)
  const interim = ref('')
  const audioOn = ref(false)
  let rec = null
  let finalText = ''
  let timer = null
  let cancelled = false

  const clearTimer = () => { clearTimeout(timer); timer = null }
  const arm = ms => { clearTimer(); if (ms > 0) timer = setTimeout(stop, ms) }

  function start() {
    if (!supported || listening.value) return
    finalText = ''; interim.value = ''; cancelled = false; audioOn.value = false
    rec = new Ctor()
    rec.lang = lang
    rec.interimResults = true
    // Su iOS la modalità continua è inaffidabile: lì basta una frase (si chiude da sola alla pausa).
    rec.continuous = !isIOS()
    rec.onresult = (e) => {
      // Si ricostruisce SEMPRE da tutti i risultati della sessione: accodare solo i nuovi (da resultIndex) duplica il testo
      // su Android, dove ogni aggiornamento parziale arriva come nuovo segmento cumulativo («inizia», «inizia una», …).
      finalText = mergeSegments(Array.from(e.results, r => r[0]?.transcript || ''))
      interim.value = finalText
      arm(silenceMs)
    }
    // Il timer di registrazione parte solo quando l'audio è davvero acceso (dopo l'eventuale richiesta di permesso).
    rec.onaudiostart = () => { audioOn.value = true }
    rec.onerror = (e) => {
      clearTimer(); listening.value = false
      // Con una trascrizione valida già raccolta l'errore (es. rete caduta a fine frase) non va mostrato: onend la invia.
      if (e.error !== 'no-speech' && e.error !== 'aborted' && !finalText.trim()) onError?.(e.error)
    }
    rec.onend = () => {
      clearTimer()
      listening.value = false
      const text = finalText.trim()
      interim.value = ''
      if (text && !cancelled) onResult?.(text)
    }
    try { rec.start(); listening.value = true; arm(idleMs) } catch { listening.value = false }
  }
  // Chiude l'ascolto senza inviare nulla (zona di annullo del tieni-premuto).
  function cancel() { cancelled = true; clearTimer(); try { rec?.abort() } catch { /* */ }; listening.value = false; interim.value = '' }
  function stop() { clearTimer(); try { rec?.stop() } catch { /* già fermo */ } }
  if (getCurrentInstance()) onBeforeUnmount(() => { clearTimer(); try { rec?.abort() } catch { /* */ } })

  return { supported, listening, audioOn, interim, start, stop, cancel }
}

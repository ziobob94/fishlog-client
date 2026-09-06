import { ref } from 'vue'

// Diversi browser/dispositivi supportano codec diversi per MediaRecorder
// (Chrome/Firefox desktop e Android: webm/opus; Safari iOS/macOS: mp4).
// Non specificare un mimeType lascia il browser libero di sceglierne uno,
// ma poi va usato ESATTAMENTE quello per etichettare il Blob risultante:
// dichiarare un mimeType diverso da quello reale (es. sempre 'audio/webm')
// produce un file che i player non riescono a decodificare (durata 0, errore).
const CANDIDATE_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg'
]

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return null
  return CANDIDATE_MIME_TYPES.find(t => MediaRecorder.isTypeSupported(t)) || null
}

// Wrapper minimale su MediaRecorder per i vocali della chat: start() chiede il
// permesso al microfono e avvia la registrazione, stop() la ferma e risolve
// con il Blob audio registrato.
export function useVoiceRecorder() {
  const recording = ref(false)
  const elapsedSeconds = ref(0)

  let mediaRecorder = null
  let chunks = []
  let stream = null
  let timer = null
  let mimeType = null

  async function start() {
    if (typeof MediaRecorder === 'undefined') throw new Error('MediaRecorder non supportato su questo dispositivo')

    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    mimeType = pickSupportedMimeType()
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    // Il browser può scegliere un codec diverso da quello richiesto: l'unica
    // fonte affidabile per il mimeType reale del Blob è mediaRecorder.mimeType.
    mimeType = mediaRecorder.mimeType || mimeType || 'audio/webm'
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    mediaRecorder.start()

    recording.value = true
    elapsedSeconds.value = 0
    timer = setInterval(() => { elapsedSeconds.value += 1 }, 1000)
  }

  function stop() {
    return new Promise((resolve) => {
      if (!mediaRecorder) return resolve(null)
      mediaRecorder.onstop = () => {
        clearInterval(timer)
        stream.getTracks().forEach(t => t.stop())
        recording.value = false
        resolve(chunks.length ? new Blob(chunks, { type: mimeType }) : null)
      }
      mediaRecorder.stop()
    })
  }

  function cancel() {
    if (!mediaRecorder) return
    mediaRecorder.onstop = null
    mediaRecorder.stop()
    clearInterval(timer)
    stream.getTracks().forEach(t => t.stop())
    recording.value = false
  }

  return { recording, elapsedSeconds, start, stop, cancel }
}

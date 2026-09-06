import { ref } from 'vue'

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

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    mediaRecorder = new MediaRecorder(stream)
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
        resolve(new Blob(chunks, { type: 'audio/webm' }))
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

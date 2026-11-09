import { ref, computed } from 'vue'

// Stato condiviso a livello di modulo: l'evento arriva una sola volta.
const deferredPrompt = ref(null)
const installed = ref(false)
let initialized = false

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
const isStandalone = () =>
  (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
  window.navigator.standalone === true

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  installed.value = isStandalone()
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferredPrompt.value = e
  })
  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferredPrompt.value = null
  })
}

export function useInstallPrompt() {
  init()
  const isIos = computed(() => ios)
  // iOS: sempre mostrabile (istruzioni) se non già installata; Android: solo con evento disponibile
  const canInstall = computed(() => !installed.value && (ios || !!deferredPrompt.value))

  async function install() {
    const p = deferredPrompt.value
    if (!p) return
    p.prompt()
    await p.userChoice.catch(() => {})
    deferredPrompt.value = null
  }

  return { canInstall, isIos, install }
}

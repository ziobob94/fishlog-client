import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router, { setupGuards } from './router/index.js'
import { useAuthStore } from './stores/auth.js'
import { useOfflineStore } from './stores/offline.js'
import { useFeaturesStore } from './stores/features.js'
import { useThemeStore } from './stores/theme.js'
import App from './App.vue'
import i18n from './i18n/index.js'
import './assets/main.css'
import { setupFormA11y } from './utils/formA11y.js'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Inizializza token da localStorage prima dei guard
const auth = useAuthStore()
auth.initAuth()
setupGuards(router)

useThemeStore().init()

// Carica la coda offline da IndexedDB e prova subito a sincronizzarla
useOfflineStore().init()

useFeaturesStore().fetchFeatures()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

// Segnaposto per i campi data/ora: iOS Safari li mostra completamente vuoti.
// Uso: <input type="date" v-ph="'gg/mm/aaaa'" />  (stile in main.css, solo iOS)
function syncPh(el, binding) {
  el.dataset.placeholder = binding.value || ''
  el.classList.toggle('is-empty', !el.value)
}
app.directive('ph', {
  mounted(el, binding) {
    syncPh(el, binding)
    el.addEventListener('input', () => syncPh(el, binding))
    el.addEventListener('change', () => syncPh(el, binding))
  },
  updated: syncPh
})

app.mount('#app')
setupFormA11y()
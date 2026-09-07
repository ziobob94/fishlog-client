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

app.mount('#app')
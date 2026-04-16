import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router, { setupGuards } from './router/index.js'
import { useAuthStore } from './stores/auth.js'
import App from './App.vue'
import './assets/main.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inizializza token da localStorage prima dei guard
const auth = useAuthStore()
auth.initAuth()
setupGuards(router)

app.mount('#app')
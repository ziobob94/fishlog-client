import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

export const useFeaturesStore = defineStore('features', () => {
  const passwordAuthEnabled = ref(true)
  const loaded = ref(false)

  async function fetchFeatures() {
    try {
      const { data } = await api.get('/auth/features')
      passwordAuthEnabled.value = data.passwordAuthEnabled
    } catch {
      // Se la chiamata fallisce si mantiene il default (abilitato): non
      // vogliamo che un errore di rete blocchi login/OAuth già funzionanti.
    } finally {
      loaded.value = true
    }
  }

  return { passwordAuthEnabled, loaded, fetchFeatures }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api.js'

// Dati del Titolare del trattamento, compilabili da un admin nel pannello
// di configurazione (gruppo "Dati legali") invece che scritti a mano nelle
// pagine Privacy/Termini. Finché non vengono impostati, i getter *OrPlaceholder
// restituiscono un segnaposto tra parentesi quadre.
export const useLegalStore = defineStore('legal', () => {
  const companyName  = ref('')
  const address      = ref('')
  const taxId        = ref('')
  const contactEmail = ref('')
  const loaded       = ref(false)

  async function fetchLegalInfo() {
    try {
      const { data } = await api.get('/legal')
      companyName.value  = data.companyName  || ''
      address.value      = data.address      || ''
      taxId.value        = data.taxId        || ''
      contactEmail.value = data.contactEmail || ''
    } catch {
      // Se la chiamata fallisce restano i segnaposto: non deve mai bloccare
      // la visualizzazione delle pagine legali.
    } finally {
      loaded.value = true
    }
  }

  function orPlaceholder(value, placeholder) {
    return value?.trim() ? value : placeholder
  }

  return {
    companyName, address, taxId, contactEmail, loaded, fetchLegalInfo,
    companyNameOrPlaceholder:  () => orPlaceholder(companyName.value,  '[NOME / RAGIONE SOCIALE DEL TITOLARE]'),
    addressOrPlaceholder:      () => orPlaceholder(address.value,      '[INDIRIZZO COMPLETO]'),
    taxIdOrPlaceholder:        () => orPlaceholder(taxId.value,        '[CF/P.IVA]'),
    contactEmailOrPlaceholder: () => orPlaceholder(contactEmail.value, '[EMAIL DI CONTATTO PRIVACY]')
  }
})

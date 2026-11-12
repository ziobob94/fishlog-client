import { ref } from 'vue'

// Ultima modifica alle catture di un'uscita: dopo il salvataggio il dettaglio evidenzia la cattura
// e offre «Annulla», che ripristina `previous` (le catture e l'eventuale fascia oraria di prima).
export const lastCatchChange = ref(null) // { sessionId, catchId, previous, kind }
export const setLastCatchChange = v => { lastCatchChange.value = v }
export const clearLastCatchChange = () => { lastCatchChange.value = null }

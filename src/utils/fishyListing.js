// Annunci proposti da Fishy: utilità pure (testabili). Fishy non pubblica: prepara una bozza che l'utente conferma.

// Bozza parziale in attesa di una risposta (manca prezzo, condizione…): si rimanda al server col comando successivo,
// così «50 euro, usata» completa l'annuncio invece di essere interpretato da solo.
export function pendingListingDraft(notices = []) {
  const n = [...notices].reverse().find(x => x.action === 'create_listing' && x.reason === 'listing_incomplete' && x.draft)
  return n ? n.draft : null
}

// Campi del POST /listings dalla bozza del server (solo quelli noti).
export function draftToPayload(d = {}) {
  const p = { title: d.title, category: d.category || 'altro', condition: d.condition, price: d.price, currency: d.currency || 'EUR', visibility: d.visibility || 'all' }
  if (d.description) p.description = d.description
  if (d.location?.name) p.location = { name: d.location.name }
  return p
}

const eur = n => `${String(n).replace('.', ',')} €`
// «Canna da surf» · «Canne» · «Usato» · «80 €»
export function listingParts(d, { category, condition }) {
  return [d.title, category, condition, d.price != null ? eur(d.price) : null].filter(Boolean)
}

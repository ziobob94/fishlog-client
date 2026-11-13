import api from '../utils/api.js'
import { useOfflineStore } from '../stores/offline.js'

export { fmtPos, fmtPunti, leggiCsv } from '../utils/fipsas.js'

export const fipsasApi = {
  list: () => api.get('/fipsas').then((r) => r.data),
  create: (b) => api.post('/fipsas', b).then((r) => r.data),
  get: (id) => api.get(`/fipsas/${id}`).then((r) => r.data),
  patch: (id, b) => api.patch(`/fipsas/${id}`, b).then((r) => r.data),
  duplica: (id) => api.post(`/fipsas/${id}/duplica`).then((r) => r.data),
  giudici: (id, userIds) => api.put(`/fipsas/${id}/giudici`, { userIds }).then((r) => r.data),
  concorrenti: (id) => api.get(`/fipsas/${id}/concorrenti`).then((r) => r.data),
  addConcorrente: (id, b) => api.post(`/fipsas/${id}/concorrenti`, b).then((r) => r.data),
  patchConcorrente: (id, cid, b) => api.patch(`/fipsas/${id}/concorrenti/${cid}`, b).then((r) => r.data),
  delConcorrente: (id, cid) => api.delete(`/fipsas/${id}/concorrenti/${cid}`).then((r) => r.data),
  importa: (id, rows, dryRun) => api.post(`/fipsas/${id}/concorrenti/import`, { rows, dryRun }).then((r) => r.data),
  sorteggio: (id, conferma) => api.post(`/fipsas/${id}/sorteggio`, { conferma }).then((r) => r.data),
  classifiche: (id) => api.get(`/fipsas/${id}/classifiche`).then((r) => r.data),
  chiudiSettore: (id, l) => api.post(`/fipsas/${id}/settori/${l}/chiudi`).then((r) => r.data),
  riapriSettore: (id, l) => api.post(`/fipsas/${id}/settori/${l}/riapri`).then((r) => r.data),
  pdf: (id, docs, direttore, giudice) =>
    api.get(`/fipsas/${id}/pdf`, { params: { docs: docs.join(','), direttore, giudice }, responseType: 'blob' }).then((r) => r.data),
  pubblica: (slug) => api.get(`/public/fipsas/${slug}`).then((r) => r.data),
}

/**
 * Registra una pesata. Senza rete (o con errore di rete) finisce nella coda offline del dispositivo e parte da sola
 * appena torna la connessione. `clientTime` rende l'invio idempotente: il server ignora una scrittura più vecchia di quella salvata.
 * Ritorna { queued: boolean, data? }.
 */
export async function salvaPesata(provaId, concorrenteId, valori) {
  const offline = useOfflineStore()
  const url = `/fipsas/${provaId}/pesate/${concorrenteId}`
  const data = { ...valori, clientTime: Date.now() }
  const meta = { kind: 'fipsas-pesata', provaId, concorrenteId }
  if (!offline.online) { await accoda(offline, url, data, meta); return { queued: true } }
  try {
    const r = await api.put(url, data)
    return { queued: false, data: r.data }
  } catch (err) {
    if (!err.response) { await accoda(offline, url, data, meta); return { queued: true } }
    throw err
  }
}

async function accoda(offline, url, data, meta) {
  // una sola voce in coda per concorrente: l'ultima modifica sostituisce la precedente
  const prec = offline.outbox.find((i) => i.meta?.kind === 'fipsas-pesata' && i.meta.concorrenteId === meta.concorrenteId && i.meta.provaId === meta.provaId && i.status !== 'error')
  if (prec) { await offline.removeFromQueue(prec.localId) }
  await offline.enqueue('put', url, data, meta)
}

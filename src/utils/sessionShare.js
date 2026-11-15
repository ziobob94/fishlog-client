import api from './api.js'

// Link pubblico di sola lettura di un'uscita: lo crea e lo revoca solo l'autore.
export const sessionShareApi = {
  create: (id) => api.post(`/sessions/${id}/share`).then(r => r.data),
  revoke: (id) => api.delete(`/sessions/${id}/share`).then(r => r.data),
  publicView: (token) => api.get(`/public/sessions/${token}`).then(r => r.data),
}

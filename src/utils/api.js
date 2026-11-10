import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api`,
  timeout: 30000
})

// Inietta token se presente al momento della creazione
const stored = localStorage.getItem('fl_token')
if (stored) api.defaults.headers.common['Authorization'] = `Bearer ${stored}`

// Endpoint in cui un 401 significa "credenziali/password errata" e non
// "sessione scaduta": l'errore va mostrato dal form, senza disconnettere.
const CREDENTIAL_CHECKS = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/forgot-password', '/auth/me/password', '/auth/me/email', '/auth/me']
const isCredentialCheck = (cfg) =>
  (cfg?.url || '').split('?')[0] && CREDENTIAL_CHECKS.includes((cfg.url || '').split('?')[0]) &&
  !(cfg.url === '/auth/me' && (cfg.method || 'get').toLowerCase() === 'get')

// 401 → sessione scaduta: redirect login
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !isCredentialCheck(err.config)) {
      localStorage.removeItem('fl_token')
      localStorage.removeItem('fl_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
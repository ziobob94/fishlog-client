import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api`,
  timeout: 30000
})

// Inietta token se presente al momento della creazione
const stored = localStorage.getItem('fl_token')
if (stored) api.defaults.headers.common['Authorization'] = `Bearer ${stored}`

// 401 → redirect login
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fl_token')
      localStorage.removeItem('fl_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
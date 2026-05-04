import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const signup = (email: string, password: string) =>
  api.post('/auth/signup', { email, password })

export const getMe = () => api.get('/users/me')

// Market data
export const getMarketTicker = async () => {
  const symbols = ['BTC-USD', 'ETH-USD', 'AAPL', 'TSLA', 'SPY', 'NVDA']
  const res = await api.get(`/analyze-trendline?symbol=BTC-USD&period=1d&interval=1h`)
  return res.data
}

// Events
export const getEvents = (limit = 20) => api.get(`/events?limit=${limit}`)

// Admin
export const adminGetUsers = () => api.get('/admin/users')
export const adminGetTransactions = () => api.get('/admin/transactions')
export const adminApproveTransaction = (transaction_id: string, tx_hash?: string) =>
  api.post('/admin/approve-transaction', { transaction_id, tx_hash })
export const adminRejectTransaction = (transaction_id: string) =>
  api.post('/admin/reject-transaction', { transaction_id })
export const adminDeleteUser = (email: string) =>
  api.post('/admin/delete-user', null, { params: { email } })

// Bot
export const getBotStatus = () => api.get('/public/bot/status')
export const startBot = () => api.post('/public/bot/start')
export const stopBot = () => api.post('/public/bot/stop')
export const getBotTrades = (limit = 20) => api.get(`/public/bot/trades?limit=${limit}`)

// Health
export const getHealth = () => api.get('/health')

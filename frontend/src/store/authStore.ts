import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  full_name?: string
  is_admin: boolean
  is_active: boolean
  is_mail_verified?: boolean
  default_capital?: number
  risk_per_trade?: number
  max_drawdown?: number
  created_at?: string
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'finai-auth' }
  )
)

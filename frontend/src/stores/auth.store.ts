import { create } from 'zustand'
import { bootstrapSession, setAccessToken as setApiToken, setUnauthorizedHandler } from '@/services/api'
import { authService } from '@/services/auth.service'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; full_name: string; password: string; timezone: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: { full_name?: string; timezone?: string }) => Promise<void>
  clear: () => void
}

function syncToken(token: string | null): void {
  setApiToken(token)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return
    set({ isLoading: true })
    try {
      const token = await bootstrapSession()
      syncToken(token)
      const user = await authService.me()
      set({ user, accessToken: token })
    } catch {
      set({ user: null, accessToken: null })
      syncToken(null)
    } finally {
      set({ isLoading: false, initialized: true })
    }
  },

  login: async (email, password) => {
    const result = await authService.login(email, password)
    syncToken(result.access_token)
    const user = await authService.me()
    set({ user, accessToken: result.access_token })
  },

  register: async (data) => {
    const result = await authService.register(data)
    syncToken(result.access_token)
    const user = await authService.me()
    set({ user, accessToken: result.access_token })
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, accessToken: null })
    syncToken(null)
  },

  refreshUser: async () => {
    const user = await authService.me()
    set({ user })
  },

  updateProfile: async (data) => {
    const user = await authService.updateProfile(data)
    set({ user })
  },

  clear: () => {
    set({ user: null, accessToken: null })
    syncToken(null)
  },
}))

setUnauthorizedHandler(() => {
  useAuthStore.getState().clear()
})

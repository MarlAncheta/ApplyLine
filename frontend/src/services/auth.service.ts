import { api, setAccessToken } from './api'
import type { User } from '@/types'

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  csrf_token: string
}

export const authService = {
  async register(data: {
    email: string
    full_name: string
    password: string
    timezone: string
  }): Promise<TokenResponse> {
    const { data: result } = await api.post<TokenResponse>('/auth/register', data)
    setAccessToken(result.access_token)
    return result
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password })
    setAccessToken(data.access_token)
    return data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  async updateProfile(data: { full_name?: string; timezone?: string }): Promise<User> {
    const { data: user } = await api.patch<User>('/auth/me', data)
    return user
  },

  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.post('/auth/change-password', { current_password, new_password })
  },

  async forgotPassword(email: string): Promise<string> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
    return data.message
  },
}

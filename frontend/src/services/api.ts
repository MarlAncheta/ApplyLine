import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

// Service modules call paths like `/auth/register`, so the base URL must end in `/api`.
// Accept both the bare host and host+/api to avoid configuration mistakes.
const configuredBase = import.meta.env.VITE_API_URL?.trim() || '/api'
const baseURL = configuredBase.endsWith('/api')
  ? configuredBase
  : `${configuredBase.replace(/\/$/, '')}/api`

let accessToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

/** Used at app startup to restore a session from the HttpOnly refresh cookie. */
export function bootstrapSession(): Promise<string> {
  return refreshAccessToken()
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${baseURL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { 'X-CSRF-Token': getCookie('csrf_token') ?? '' },
        },
      )
      .then((response) => {
        const token = response.data.access_token as string
        setAccessToken(token)
        return token
      })
      .catch((error: unknown) => {
        unauthorizedHandler?.()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    const url = original?.url ?? ''
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        const token = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${token}`
        return api.request(original as AxiosRequestConfig)
      } catch {
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export interface ApiErrorShape {
  detail?: string
  message?: string
  errors?: unknown[]
}

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined
    if (typeof data?.detail === 'string') return data.detail
    if (typeof data?.message === 'string') return data.message
    if (error.response?.status === 429) return 'Too many attempts. Please wait a moment and try again.'
    if (!error.response) return 'Cannot reach the server. Please check your connection.'
  }
  return fallback
}

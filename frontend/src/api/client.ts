import axios from 'axios'
import type { TokenResponse, AccessTokenResponse } from '../types'

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

// Token storage
export const tokens = {
  getAccess:  () => localStorage.getItem('nse_at'),
  getRefresh: () => localStorage.getItem('nse_rt'),
  set: (at: string, rt: string) => {
    localStorage.setItem('nse_at', at)
    localStorage.setItem('nse_rt', rt)
  },
  clear: () => {
    localStorage.removeItem('nse_at')
    localStorage.removeItem('nse_rt')
  },
}

// Axios instance
export const api = axios.create({ baseURL: BASE })

// Attach token to every request
api.interceptors.request.use(config => {
  const at = tokens.getAccess()
  if (at) config.headers.Authorization = `Bearer ${at}`
  return config
})

// Silent refresh on 401
let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }
    original._retry = true

    if (!refreshing) {
      refreshing = (async () => {
        const rt = tokens.getRefresh()
        if (!rt) throw new Error('No refresh token')
        const { data } = await axios.post<AccessTokenResponse>(
          `${BASE}/auth/refresh`, { refresh_token: rt })
        tokens.set(data.access_token, data.refresh_token)
        return data.access_token
      })().finally(() => { refreshing = null })
    }

    try {
      const at = await refreshing
      original.headers.Authorization = `Bearer ${at}`
      return api(original)
    } catch {
      tokens.clear()
      window.location.href = '/login'
      return Promise.reject(err)
    }
  }
)

// Auth endpoints (no interceptor needed — unauthenticated)
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    axios.post<TokenResponse>(`${BASE}/auth/register`, data).then(r => r.data),

  login: (data: { email: string; password: string }) =>
    axios.post<TokenResponse>(`${BASE}/auth/login`, data).then(r => r.data),
}

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi, api, tokens } from '../api/client'
import type { User } from '../types'

interface AuthCtx {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, full_name?: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const at = tokens.getAccess()
    if (!at) { setLoading(false); return }

    api.get<User>('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => { tokens.clear() })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
    tokens.set(data.access_token, data.refresh_token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (
    email: string, username: string, password: string, full_name?: string
  ) => {
    const data = await authApi.register({ email, username, password, full_name })
    tokens.set(data.access_token, data.refresh_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    const rt = tokens.getRefresh()
    if (rt) api.post('/auth/logout', { refresh_token: rt }).catch(() => {})
    tokens.clear()
    setUser(null)
  }, [])

  return (
    <Ctx.Provider value={{
      user, loading,
      isAuthenticated: !!user && !loading,
      login, register, logout,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

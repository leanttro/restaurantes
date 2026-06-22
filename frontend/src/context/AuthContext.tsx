'use client'

import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth'
import { storage } from '@/utils/storage'
import { ApiError } from '@/types/api'
import { LoginPayload, RegisterPayload, User } from '@/types'

interface AuthContextValue {
  user: User | null; loading: boolean; error: string | null; isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const bootstrap = async () => {
      const token = storage.getAccessToken()
      const cachedUser = storage.getUser<User>()
      if (!token) { setLoading(false); return }
      if (cachedUser) setUser(cachedUser)
      try {
        const freshUser = await authService.fetchCurrentUser()
        setUser(freshUser)
      } catch {
        storage.clearAll(); setUser(null)
      } finally { setLoading(false) }
    }
    bootstrap()
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    setError(null)
    try {
      const { user: u } = await authService.login(payload)
      setUser(u); return u
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao entrar.'
      setError(msg); throw err
    }
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null)
    try {
      const { user: u } = await authService.register(payload)
      setUser(u); return u
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Falha ao criar conta.'
      setError(msg); throw err
    }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined)
    setUser(null); router.push('/login')
  }, [router])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, isAuthenticated: !!user, login, register, logout, clearError }),
    [user, loading, error, login, register, logout, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

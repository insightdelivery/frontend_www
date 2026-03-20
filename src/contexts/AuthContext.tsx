'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { initAuth, logout as authLogout, type UserInfo } from '@/services/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: UserInfo | null
  setUser: (user: UserInfo | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUserState] = useState<UserInfo | null>(null)

  useEffect(() => {
    const init = async () => {
      const token = Cookies.get('accessToken')
      if (!token) {
        setUserState(null)
        setStatus('unauthenticated')
        return
      }
      try {
        const u = await initAuth()
        setUserState(u ?? null)
        setStatus(u ? 'authenticated' : 'unauthenticated')
      } catch {
        setUserState(null)
        setStatus('unauthenticated')
      }
    }
    init()
  }, [])

  const setUser = useCallback((u: UserInfo | null) => {
    setUserState(u)
    setStatus(u ? 'authenticated' : 'unauthenticated')
  }, [])

  const logout = useCallback(async () => {
    await authLogout().catch(() => {})
    setUserState(null)
    setStatus('unauthenticated')
  }, [])

  const value: AuthContextValue = {
    status,
    user,
    setUser,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

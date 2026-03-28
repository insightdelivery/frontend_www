'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

  /** accessToken은 메모리만 — 새로고침 후 복구는 initAuth(restoreSessionTokens + getMe)로 비동기 처리 */
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const u = await initAuth()
        if (cancelled) return
        setUserState(u ?? null)
        setStatus(u ? 'authenticated' : 'unauthenticated')
      } catch {
        if (!cancelled) {
          setUserState(null)
          setStatus('unauthenticated')
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
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

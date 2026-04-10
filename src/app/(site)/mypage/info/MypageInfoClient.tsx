'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'
import MypageProfilePasswordGate from '@/components/profile/MypageProfilePasswordGate'
import { getMe, isAuthenticated } from '@/services/auth'
import { useLoginHref } from '@/hooks/useLoginHref'
import { mypageInfoUnlockStorageKey } from '@/lib/mypageProfileUnlock'
import type { UserInfo } from '@/services/auth'

export default function MypageInfoClient() {
  const router = useRouter()
  const loginHref = useLoginHref()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [unlocked, setUnlocked] = useState(false)

  const applyUnlockState = useCallback((u: UserInfo) => {
    const isLocal = (u.joined_via || 'LOCAL') === 'LOCAL'
    if (!isLocal) {
      setUnlocked(true)
      return
    }
    if (typeof window !== 'undefined' && sessionStorage.getItem(mypageInfoUnlockStorageKey(u.id)) === '1') {
      setUnlocked(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(loginHref)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const u = await getMe()
        if (cancelled) return
        setUser(u)
        applyUnlockState(u)
      } catch {
        if (!cancelled) router.replace(loginHref)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, loginHref, applyUnlockState])

  const handleVerified = useCallback(() => {
    if (user) {
      sessionStorage.setItem(mypageInfoUnlockStorageKey(user.id), '1')
    }
    setUnlocked(true)
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">세션 확인 중…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const needsPasswordGate = (user.joined_via || 'LOCAL') === 'LOCAL' && !unlocked

  return (
    <div className="w-full max-w-[900px]">
      {needsPasswordGate ? <MypageProfilePasswordGate onVerified={handleVerified} /> : <ProfileForm variant="mypage" />}
    </div>
  )
}

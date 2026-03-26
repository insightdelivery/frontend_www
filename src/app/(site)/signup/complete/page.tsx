'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 예전 이메일 인증 안내 URL 호환 — 메인으로 이동 (userJoinPlan: 이메일 인증 단계 없음)
 */
export default function SignupCompletePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/')
  }, [router])
  return (
    <div className="min-h-screen flex flex-col bg-white items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-600" />
      <p className="mt-4 text-gray-500 text-sm">이동 중...</p>
    </div>
  )
}

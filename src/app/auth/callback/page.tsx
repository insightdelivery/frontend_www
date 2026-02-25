'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMe } from '@/services/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await getMe()
        
        if (user.profile_completed) {
          router.push('/')
        } else {
          router.push('/signup/complete')
        }
      } catch (error) {
        console.error('콜백 처리 오류:', error)
        setStatus('error')
        setTimeout(() => {
          router.push('/login?error=OAUTH_FAILED')
        }, 2000)
      }
    }

    handleCallback()
  }, [router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">소셜 로그인 처리 중 오류가 발생했습니다.</p>
          <p className="text-sm text-gray-600 mt-2">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}





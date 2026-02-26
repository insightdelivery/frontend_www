'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMe, saveTokens } from '@/services/auth'

const ERROR_MESSAGES: Record<string, string> = {
  OAUTH_DENIED: 'Google 로그인이 취소되었습니다.',
  OAUTH_NO_CODE: '인증 정보를 받지 못했습니다.',
  OAUTH_CONFIG: 'Google 로그인 설정이 되어 있지 않습니다.',
  OAUTH_FAILED: 'Google 로그인에 실패했습니다.',
  OAUTH_NO_EMAIL: '이메일 정보를 받지 못했습니다.',
  EMAIL_ALREADY_REGISTERED: '이미 같은 이메일로 가입된 계정이 있습니다. 비밀번호 로그인을 이용해 주세요.',
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const error = searchParams.get('error')

      if (error) {
        setErrorMessage(ERROR_MESSAGES[error] || '소셜 로그인에 실패했습니다.')
        setStatus('error')
        setTimeout(() => {
          router.replace(`/login?error=${encodeURIComponent(error)}`)
        }, 2500)
        return
      }

      if (accessToken && refreshToken) {
        try {
          saveTokens(accessToken, refreshToken)
          const user = await getMe()
          saveTokens(accessToken, refreshToken, user)
          const fromSignup = searchParams.get('from') === 'signup'
          if (user.profile_completed) {
            router.replace(fromSignup ? '/?welcome=1' : '/')
          } else if (user.joined_via === 'GOOGLE') {
            router.replace('/signup/complete-profile')
          } else {
            router.replace('/signup/complete')
          }
          return
        } catch (e) {
          console.error('OAuth 콜백 후 사용자 정보 조회 오류:', e)
          setStatus('error')
          setErrorMessage('로그인 처리 중 오류가 발생했습니다.')
          setTimeout(() => router.replace('/login?error=OAUTH_FAILED'), 2500)
          return
        }
      }

      try {
        const user = await getMe()
        if (user.profile_completed) {
          router.replace('/')
        } else if (user.joined_via === 'GOOGLE') {
          router.replace('/signup/complete-profile')
        } else {
          router.replace('/signup/complete')
        }
      } catch (error) {
        console.error('콜백 처리 오류:', error)
        setStatus('error')
        setErrorMessage('로그인 처리 중 오류가 발생했습니다.')
        setTimeout(() => router.replace('/login?error=OAUTH_FAILED'), 2500)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600">{errorMessage}</p>
          <p className="text-sm text-gray-600 mt-2">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}

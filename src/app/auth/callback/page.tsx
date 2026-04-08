'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMe, saveTokens, setOauthPendingTempToken } from '@/services/auth'
import {
  consumePostLoginNextFromSession,
  getSafePostLoginRedirect,
  POST_LOGIN_NEXT_SESSION_KEY,
} from '@/lib/postLoginRedirect'
import { useAuth } from '@/contexts/AuthContext'

const ERROR_MESSAGES: Record<string, string> = {
  OAUTH_DENIED: '소셜 로그인이 취소되었습니다.',
  OAUTH_NO_CODE: '인증 정보를 받지 못했습니다.',
  OAUTH_CONFIG: '소셜 로그인 설정이 되어 있지 않습니다.',
  OAUTH_FAILED: '소셜 로그인에 실패했습니다.',
  OAUTH_NO_EMAIL: '이메일 정보를 받지 못했습니다. 네이버·구글 등에서 이메일 제공에 동의했는지 확인해 주세요.',
  EMAIL_ALREADY_REGISTERED: '이미 같은 이메일로 가입된 계정이 있습니다. 비밀번호 로그인을 이용해 주세요.',
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      // 리다이렉트 직후 useSearchParams()가 아직 반영되지 않을 수 있으므로 URL에서 직접 읽기
      const params =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams(searchParams?.toString() ?? '')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const tempToken = params.get('temp_token')
      const error = params.get('error')

      if (error) {
        setErrorMessage(ERROR_MESSAGES[error] || '소셜 로그인에 실패했습니다.')
        setStatus('error')
        setTimeout(() => {
          router.replace(`/login?error=${encodeURIComponent(error)}`)
        }, 2500)
        return
      }

      if (tempToken) {
        try {
          sessionStorage.removeItem(POST_LOGIN_NEXT_SESSION_KEY)
        } catch {
          /* ignore */
        }
        setOauthPendingTempToken(tempToken)
        router.replace('/signup/phone')
        return
      }

      // refresh는 API 리다이렉트 응답의 HttpOnly 쿠키에만 둘 수 있음(쿼리의 refresh_token은 선택)
      if (accessToken) {
        try {
          saveTokens(accessToken, refreshToken || '')
          const user = await getMe()
          saveTokens(accessToken, refreshToken || '', user)
          setUser(user)
          const fromSignup = params.get('from') === 'signup'
          if (fromSignup) {
            try {
              sessionStorage.removeItem(POST_LOGIN_NEXT_SESSION_KEY)
            } catch {
              /* ignore */
            }
            router.replace('/?welcome=1')
            return
          }
          const storedNext = consumePostLoginNextFromSession()
          router.replace(getSafePostLoginRedirect(storedNext || params.get('next')))
          return
        } catch (e) {
          console.error('OAuth 콜백 후 사용자 정보 조회 오류:', e)
          setStatus('error')
          setErrorMessage('로그인 처리 중 오류가 발생했습니다.')
          setTimeout(() => router.replace('/login?error=OAUTH_FAILED'), 2500)
          return
        }
      }

      setStatus('error')
      setErrorMessage('로그인 정보를 받지 못했습니다.')
      setTimeout(() => router.replace('/login?error=OAUTH_NO_CODE'), 2500)
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

'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { getApiBaseURL } from '@/lib/axios'
import { login, resendVerificationEmail } from '@/services/auth'
import { loadSysCodeOnLogin, SYSCODE_PARENT_IDS } from '@/lib/syscode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconKakao, IconNaver, IconGoogle } from '@/components/login/SocialLoginIcons'
import Footer from '@/components/layout/Footer'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [autoLogin, setAutoLogin] = useState(false)

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await login(data)

      try {
        for (const parentId of SYSCODE_PARENT_IDS) {
          await loadSysCodeOnLogin(parentId)
        }
      } catch {
        // ignore
      }

      if (response.user.profile_completed) {
        router.push('/')
      } else {
        router.push('/signup/complete')
      }
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string }
      const msg = anyErr.response?.data?.error ?? anyErr.response?.data?.message ?? anyErr.message ?? '로그인에 실패했습니다.'
      setError(msg)
      setResendStatus('idle')
      setResendMessage(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSNSLogin = (provider: 'kakao' | 'naver' | 'google') => {
    const base = getApiBaseURL().replace(/\/$/, '')
    const urls = {
      kakao: `${base}/auth/kakao/redirect/`,
      naver: `${base}/auth/naver/redirect/`,
      google: `${base}/auth/google/redirect/`,
    }
    window.location.href = urls[provider]
  }

  const errorParam = searchParams.get('error')
  const displayError = error || (errorParam === 'OAUTH_FAILED' ? '소셜 로그인에 실패했습니다.' : null)
  const isEmailNotVerified = typeof displayError === 'string' && displayError.includes('이메일 인증')
  const loginEmail = watch('email')

  const handleResendVerification = async () => {
    const email = loginEmail?.trim()
    if (!email) {
      setResendMessage('이메일을 입력한 뒤 다시 시도해 주세요.')
      setResendStatus('error')
      return
    }
    setResendStatus('sending')
    setResendMessage(null)
    const result = await resendVerificationEmail(email)
    if (result.success) {
      setResendStatus('success')
      setResendMessage(result.message || '인증 메일을 발송했습니다.')
    } else {
      setResendStatus('error')
      setResendMessage(result.error || '재발송에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px] flex flex-col items-center">
          {/* 로고 & 슬로건 (Figma) */}
          <div className="text-center mb-10">
            <Image
              src="/inde_logo.png"
              alt="InDe"
              width={140}
              height={40}
              className="mx-auto object-contain"
              priority
            />
            <p className="mt-2 text-sm text-gray-500">기독교 인사이트 콘텐츠 플랫폼</p>
          </div>

          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {displayError && (
              <div className="rounded-lg bg-red-50 p-4 space-y-2">
                <p className="text-sm text-red-800">{displayError}</p>
                {isEmailNotVerified && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendStatus === 'sending'}
                      className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {resendStatus === 'sending' ? '발송 중...' : '이메일 인증 메일 다시 보내기'}
                    </button>
                    {resendStatus === 'success' && resendMessage && (
                      <p className="mt-2 text-sm text-green-700">{resendMessage}</p>
                    )}
                    {resendStatus === 'error' && resendMessage && (
                      <p className="mt-2 text-sm text-red-700">{resendMessage}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="이메일 주소"
                {...register('email')}
                className={cn(
                  'h-12 rounded-lg border-0 bg-gray-100 text-gray-900 placeholder:text-gray-400',
                  'focus-visible:ring-2 focus-visible:ring-gray-300'
                )}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호"
                {...register('password')}
                className={cn(
                  'h-12 rounded-lg border-0 bg-gray-100 text-gray-900 placeholder:text-gray-400 pr-12',
                  'focus-visible:ring-2 focus-visible:ring-gray-300'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-12 rounded-lg font-bold text-black',
                'bg-[#D4F74C] hover:bg-[#c5e845] focus-visible:ring-gray-400'
              )}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          {/* 자동로그인 | 아이디/비밀번호 찾기 */}
          <div className="w-full mt-5 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className="w-4 h-4 rounded-full border border-gray-300 text-gray-700 focus:ring-gray-400"
              />
              <span className="text-sm text-gray-600">자동로그인</span>
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/find-id" className="hover:text-gray-700">아이디 찾기</Link>
              <span aria-hidden>|</span>
              <Link href="/find-password" className="hover:text-gray-700">비밀번호 찾기</Link>
            </div>
          </div>

          {/* 소셜 로그인/회원가입 */}
          <div className="w-full mt-10 text-center">
            <p className="text-sm text-gray-600 mb-5">소셜 로그인/회원가입</p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleSNSLogin('kakao')}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-full"
                aria-label="카카오 로그인"
              >
                <IconKakao />
              </button>
              <button
                type="button"
                onClick={() => handleSNSLogin('naver')}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-full"
                aria-label="네이버 로그인"
              >
                <IconNaver />
              </button>
              <button
                type="button"
                onClick={() => handleSNSLogin('google')}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-full"
                aria-label="구글 로그인"
              >
                <IconGoogle />
              </button>
            </div>
          </div>

          {/* 회원가입 유도 */}
          <p className="mt-10 text-sm text-gray-600">
            아직 회원이 아니신가요?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              회원가입하기
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-600 mx-auto" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

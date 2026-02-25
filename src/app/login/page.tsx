'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { login } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  const {
    register,
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
      
      // 프로필 완성 여부 확인
      if (response.user.profile_completed) {
        router.push('/')
      } else {
        router.push('/signup/complete')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSNSLogin = (provider: 'kakao' | 'naver' | 'google') => {
    const urls = {
      kakao: 'https://api.inde.kr/auth/kakao/redirect/',
      naver: 'https://api.inde.kr/auth/naver/redirect/',
      google: 'https://api.inde.kr/auth/google/redirect/',
    }
    
    window.location.href = urls[provider]
  }

  const errorParam = searchParams.get('error')
  const displayError = error || (errorParam === 'OAUTH_FAILED' ? '소셜 로그인에 실패했습니다.' : null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            로그인
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {displayError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{displayError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="mt-1"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSNSLogin('kakao')}
              className="w-full"
            >
              카카오
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSNSLogin('naver')}
              className="w-full"
            >
              네이버
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSNSLogin('google')}
              className="w-full"
            >
              구글
            </Button>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/register"
            className="text-sm text-primary hover:text-primary/80"
          >
            계정이 없으신가요? 회원가입
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}


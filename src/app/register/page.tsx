'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getApiBaseURL } from '@/lib/axios'
import { register as registerAPI } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/layout/Footer'
import { RegisterFormLower } from '@/components/register/RegisterFormLower'
import { Eye, EyeOff } from 'lucide-react'

const registerSchema = z
  .object({
    email: z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.'),
    password: z.string().min(8, '비밀번호는 8자 이상 영문자, 숫자 조합이어야 합니다.'),
    password2: z.string().min(1, '비밀번호 확인을 입력해 주세요.'),
    name: z.string().min(1, '이름을 입력해 주세요.'),
    nickname: z.string().min(1, '닉네임을 입력해 주세요.'),
    phone: z.string().min(1, '휴대폰 번호를 입력해 주세요.'),
    age_agree: z.boolean().refine((v) => v === true, { message: '만 14세 이상 동의가 필요합니다.' }),
    terms_agree: z.boolean().refine((v) => v === true, { message: '이용약관 동의가 필요합니다.' }),
    privacy_agree: z.boolean().refine((v) => v === true, { message: '개인정보 수집·이용 동의가 필요합니다.' }),
    newsletter_agree: z.boolean().optional(),
    terms_all_agree: z.boolean().optional(),
    position: z.string().optional(),
    birth_year: z.number().optional(),
    birth_month: z.number().optional(),
    birth_day: z.number().optional(),
    region: z.string().optional(),
    is_overseas: z.boolean().optional(),
  })
  .refine((data) => data.password === data.password2, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['password2'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      age_agree: false,
      terms_agree: false,
      privacy_agree: false,
      newsletter_agree: false,
      terms_all_agree: false,
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await registerAPI({
        email: data.email,
        password: data.password,
        password_confirm: data.password2,
        name: data.name,
        nickname: data.nickname,
        phone: data.phone,
        position: data.position || undefined,
        birth_year: data.birth_year,
        birth_month: data.birth_month,
        birth_day: data.birth_day,
        region: data.region || undefined,
        is_overseas: data.is_overseas,
        newsletter_agree: data.newsletter_agree,
      })
      const email = 'email' in res ? res.email : data.email
      router.push(`/signup/complete?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      const details = err.response?.data?.details
      const msg = err.response?.data?.error
      const firstDetail = details && typeof details === 'object' && Object.values(details).flat().length
        ? (Object.values(details).flat() as string[])[0]
        : null
      setError(firstDetail || msg || err.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSNSRegister = (provider: 'kakao' | 'naver' | 'google') => {
    const base = getApiBaseURL().replace(/\/$/, '')
    const urls: Record<string, string> = {
      kakao: `${base}/auth/kakao/redirect/`,
      naver: `${base}/auth/naver/redirect/`,
      google: `${base}/auth/google/redirect/?state=signup`,
    }
    window.location.href = urls[provider] || `${base}/auth/${provider}/redirect/`
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-10">
        <p className="text-center text-sm text-gray-600 mb-2">
          이미 인디 회원이라면{' '}
          <Link href="/login" className="text-black font-medium underline hover:no-underline">
            로그인
          </Link>
        </p>
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-8">
          소셜 회원가입
        </h1>

        {/* 소셜 로그인 버튼 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSNSRegister('kakao')}
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            카카오
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSNSRegister('naver')}
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            네이버
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSNSRegister('google')}
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            구글
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-900">이메일(ID) *</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일 주소"
              autoComplete="email"
              {...register('email')}
              className="mt-1"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-900">비밀번호 *</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8자 이상 영문자, 숫자 조합"
                autoComplete="new-password"
                {...register('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password2" className="text-gray-900">비밀번호 확인</Label>
            <div className="relative mt-1">
              <Input
                id="password2"
                type={showPassword2 ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                autoComplete="new-password"
                {...register('password2')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={showPassword2 ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password2 && (
              <p className="mt-1 text-sm text-red-600">{errors.password2.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name" className="text-gray-900">이름 *</Label>
            <Input
              id="name"
              type="text"
              placeholder="이름"
              {...register('name')}
              className="mt-1"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nickname" className="text-gray-900">닉네임 *</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="닉네임"
              {...register('nickname')}
              className="mt-1"
            />
            {errors.nickname && (
              <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-gray-900">휴대폰 번호 *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="phone"
                type="tel"
                placeholder="- 생략하고 입력"
                {...register('phone')}
                className="flex-1"
              />
              <Button type="button" variant="outline" className="flex-shrink-0 border-gray-300">
                인증번호 전송
              </Button>
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* 페이지 분할 하단: 추가 정보 입력 + 이용약관 전체 동의 */}
          <RegisterFormLower register={register} errors={errors} watch={watch} setValue={setValue} />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  )
}

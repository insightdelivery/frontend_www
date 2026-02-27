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
import { IconKakao, IconNaver, IconGoogle } from '@/components/login/SocialLoginIcons'
import { Eye, EyeOff, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const inputClass = cn(
    'h-12 rounded-lg border-0 bg-gray-100 text-gray-900 placeholder:text-gray-400',
    'focus-visible:ring-2 focus-visible:ring-gray-300'
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-[450px] mx-auto px-4 py-10">
        <p className="text-center text-sm text-gray-600 mb-2">
          이미 엔디 회원이라면{' '}
          <Link href="/login" className="text-black font-medium underline hover:no-underline">
            로그인
          </Link>
        </p>
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-6">
          소셜 회원가입
        </h1>

        {/* 소셜 아이콘 (Figma) */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => handleSNSRegister('kakao')}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-full"
            aria-label="카카오 회원가입"
          >
            <IconKakao />
          </button>
          <button
            type="button"
            onClick={() => handleSNSRegister('naver')}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-full"
            aria-label="네이버 회원가입"
          >
            <IconNaver />
          </button>
          <button
            type="button"
            onClick={() => handleSNSRegister('google')}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-full"
            aria-label="구글 회원가입"
          >
            <IconGoogle />
          </button>
        </div>

        {/* 또는 이메일로 가입 */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500">또는 이메일로 가입</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-900">
              이메일(ID) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일 주소"
              autoComplete="email"
              {...register('email')}
              className={cn(inputClass, 'mt-1.5')}
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-900">
              비밀번호 <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8자 이상 영문자, 숫자 조합"
                autoComplete="new-password"
                {...register('password')}
                className={cn(inputClass, 'pr-12')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password2" className="text-gray-900">비밀번호 확인</Label>
            <div className="relative mt-1.5">
              <Input
                id="password2"
                type={showPassword2 ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                autoComplete="new-password"
                {...register('password2')}
                className={cn(inputClass, 'pr-12')}
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={showPassword2 ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password2 && (
              <p className="mt-1.5 text-sm text-red-600">{errors.password2.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name" className="text-gray-900">
              이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="이름"
              {...register('name')}
              className={cn(inputClass, 'mt-1.5')}
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nickname" className="text-gray-900">
              닉네임 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nickname"
              type="text"
              placeholder="닉네임"
              {...register('nickname')}
              className={cn(inputClass, 'mt-1.5')}
            />
            {errors.nickname && (
              <p className="mt-1.5 text-sm text-red-600">{errors.nickname.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-gray-900">
              휴대폰 번호 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1.5">
              <div className="relative flex-1 flex items-center">
                <Check className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="생략하고 입력"
                  {...register('phone')}
                  className={cn(inputClass, 'pl-10')}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="flex-shrink-0 h-12 px-4 rounded-lg border-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                인증번호 전송
              </Button>
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <RegisterFormLower register={register} errors={errors} watch={watch} setValue={setValue} />

          <Button
            type="submit"
            className={cn(
              'w-full h-16 rounded-lg font-bold text-black text-xl',
              'bg-[#D4F74C] hover:bg-[#c5e845] focus-visible:ring-gray-400'
            )}
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '회원가입 완료'}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  )
}

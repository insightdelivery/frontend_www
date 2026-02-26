'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getMe, completeProfile } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/layout/Footer'
import { RegisterFormLower } from '@/components/register/RegisterFormLower'

const optionalNumber = z.union([z.number(), z.nan()]).transform((v) => (v != null && !Number.isNaN(v) ? v : undefined))

const completeProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.'),
  nickname: z.string().min(1, '닉네임을 입력해 주세요.'),
  phone: z.string().min(1, '휴대폰 번호를 입력해 주세요.'),
  age_agree: z.boolean().refine((v) => v === true, { message: '만 14세 이상 동의가 필요합니다.' }),
  terms_agree: z.boolean().refine((v) => v === true, { message: '이용약관 동의가 필요합니다.' }),
  privacy_agree: z.boolean().refine((v) => v === true, { message: '개인정보 수집·이용 동의가 필요합니다.' }),
  newsletter_agree: z.boolean().optional(),
  terms_all_agree: z.boolean().optional(),
  position: z.string().optional(),
  birth_year: optionalNumber,
  birth_month: optionalNumber,
  birth_day: optionalNumber,
  region: z.string().optional(),
  is_overseas: z.boolean().optional(),
})

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>

/**
 * 구글 회원가입 후 부가정보 입력 페이지
 * - 이메일 수정 불가 (구글에서 가져온 값)
 * - 등록 시 이메일 인증 없이 바로 로그인 유지
 */
export default function CompleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      age_agree: false,
      terms_agree: false,
      privacy_agree: false,
      newsletter_agree: false,
      terms_all_agree: false,
      is_overseas: false,
    },
  })

  useEffect(() => {
    let mounted = true
    getMe()
      .then((user) => {
        if (!mounted) return
        if (user.profile_completed) {
          router.replace('/')
          return
        }
        setUserEmail(user.email || '')
        if (user.name) setValue('name', user.name)
        if (user.nickname) setValue('nickname', user.nickname)
        if (user.phone) setValue('phone', user.phone)
      })
      .catch(() => {
        if (mounted) router.replace('/login')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [router, setValue])

  const onSubmit = async (data: CompleteProfileFormData) => {
    setSubmitLoading(true)
    setError(null)
    try {
      const birthYear = data.birth_year && Number(data.birth_year) ? Number(data.birth_year) : undefined
      const birthMonth = data.birth_month && Number(data.birth_month) ? Number(data.birth_month) : undefined
      const birthDay = data.birth_day && Number(data.birth_day) ? Number(data.birth_day) : undefined
      await completeProfile({
        email: userEmail,
        name: data.name,
        nickname: data.nickname,
        phone: data.phone,
        position: data.position || '',
        birth_year: birthYear,
        birth_month: birthMonth,
        birth_day: birthDay,
        region_type: data.is_overseas ? 'FOREIGN' : 'DOMESTIC',
        region_domestic: data.is_overseas ? undefined : (data.region || ''),
        region_foreign: data.is_overseas ? (data.region || '') : undefined,
        newsletter_agree: data.newsletter_agree,
      })
      router.replace('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string }
      setError(e.response?.data?.error ?? e.response?.data?.message ?? (e as Error).message ?? '저장에 실패했습니다.')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-10">
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-6">
          부가 정보 입력
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          서비스 이용을 위해 아래 정보를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-900">이메일</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              readOnly
              disabled
              className="mt-1 bg-gray-100 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">이메일은 수정할 수 없습니다.</p>
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
              <Button type="button" variant="outline" className="flex-shrink-0 border-gray-300" disabled>
                인증번호 전송
              </Button>
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <RegisterFormLower register={register} errors={errors} watch={watch} setValue={setValue} />

          <Button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900" disabled={submitLoading}>
            {submitLoading ? '등록 중...' : '회원가입'}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  )
}

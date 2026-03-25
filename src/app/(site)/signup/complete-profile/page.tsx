'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getMe, completeProfile } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RegisterFormLower } from '@/components/register/RegisterFormLower'

const baseProfileFields = {
  name: z.string().min(1, '이름을 입력해 주세요.'),
  nickname: z.string().min(1, '닉네임을 입력해 주세요.'),
  phone: z.string().min(1, '휴대폰 번호를 입력해 주세요.'),
  age_agree: z.boolean().refine((v) => v === true, { message: '만 14세 이상 동의가 필요합니다.' }),
  terms_agree: z.boolean().refine((v) => v === true, { message: '이용약관 동의가 필요합니다.' }),
  privacy_agree: z.boolean().refine((v) => v === true, { message: '개인정보 수집·이용 동의가 필요합니다.' }),
  newsletter_agree: z.boolean().optional(),
  terms_all_agree: z.boolean().optional(),
}

function buildCompleteProfileSchema(kakaoNeedsEmail: boolean) {
  if (kakaoNeedsEmail) {
    return z.object({
      email: z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.'),
      ...baseProfileFields,
    })
  }
  return z.object({
    ...baseProfileFields,
  })
}

type CompleteProfileFormData = z.infer<ReturnType<typeof buildCompleteProfileSchema>>

type CompleteProfileFormProps = {
  kakaoNeedsEmail: boolean
  serverEmail: string
  initialName?: string
  initialNickname?: string
  initialPhone?: string
}

/**
 * 소셜(OAuth) 가입 후 부가정보 입력 — 구글·네이버·카카오 공통
 * - 카카오 + 이메일 미인증(플레이스홀더 등): 이메일 입력·저장 후 인증 메일 발송
 * - 그 외: 제공된 이메일 표시만(읽기 전용)
 */
function CompleteProfileForm({
  kakaoNeedsEmail,
  serverEmail,
  initialName,
  initialNickname,
  initialPhone,
}: CompleteProfileFormProps) {
  const router = useRouter()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneNotice, setDoneNotice] = useState<string | null>(null)

  const schema = useMemo(() => buildCompleteProfileSchema(kakaoNeedsEmail), [kakaoNeedsEmail])

  const defaultEmail = useMemo(() => {
    if (!kakaoNeedsEmail) return ''
    if (serverEmail.includes('@oauth-noemail.invalid')) return ''
    return serverEmail
  }, [kakaoNeedsEmail, serverEmail])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...(kakaoNeedsEmail ? { email: defaultEmail } : {}),
      age_agree: false,
      terms_agree: false,
      privacy_agree: false,
      newsletter_agree: false,
      terms_all_agree: false,
      name: initialName || '',
      nickname: initialNickname || '',
      phone: initialPhone || '',
    },
  })

  const onSubmit = useCallback(
    async (data: CompleteProfileFormData) => {
      setSubmitLoading(true)
      setError(null)
      try {
        const emailForApi = kakaoNeedsEmail && 'email' in data ? String(data.email).trim() : serverEmail
        const result = await completeProfile({
          email: emailForApi,
          name: data.name,
          nickname: data.nickname,
          phone: data.phone,
          position: '',
          newsletter_agree: data.newsletter_agree,
        })
        if (result.verification_email_sent) {
          setDoneNotice(
            '가입이 완료되었습니다. 입력하신 이메일로 인증 메일을 발송했습니다. 메일함(스팸함 포함)을 확인해 주세요.',
          )
          return
        }
        router.replace('/')
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string }
        setError(e.response?.data?.error ?? e.response?.data?.message ?? (e as Error).message ?? '저장에 실패했습니다.')
      } finally {
        setSubmitLoading(false)
      }
    },
    [kakaoNeedsEmail, router, serverEmail],
  )

  if (doneNotice) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-10">
          <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-6">
            <p className="text-sm text-green-900">{doneNotice}</p>
          </div>
          <Button type="button" className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900" onClick={() => router.replace('/')}>
            홈으로 이동
          </Button>
        </main>
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
            <Label htmlFor="email" className="text-gray-900">이메일{kakaoNeedsEmail ? ' *' : ''}</Label>
            {kakaoNeedsEmail ? (
              <>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일 주소"
                  autoComplete="email"
                  {...register('email' as keyof CompleteProfileFormData)}
                  className="mt-1"
                />
                {'email' in errors && errors.email && (
                  <p className="mt-1 text-sm text-red-600">{(errors as { email?: { message?: string } }).email?.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  로그인에 사용할 이메일을 입력해 주세요. 저장 후 인증 메일이 발송됩니다.
                </p>
              </>
            ) : (
              <>
                <Input
                  id="email"
                  type="email"
                  value={serverEmail}
                  readOnly
                  disabled
                  className="mt-1 bg-gray-100 text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">이메일은 수정할 수 없습니다.</p>
              </>
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
    </div>
  )
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kakaoNeedsEmail, setKakaoNeedsEmail] = useState(false)
  const [serverEmail, setServerEmail] = useState('')
  const [initialName, setInitialName] = useState<string | undefined>()
  const [initialNickname, setInitialNickname] = useState<string | undefined>()
  const [initialPhone, setInitialPhone] = useState<string | undefined>()

  useEffect(() => {
    let mounted = true
    getMe()
      .then((user) => {
        if (!mounted) return
        if (user.profile_completed) {
          router.replace('/')
          return
        }
        const needs =
          user.joined_via === 'KAKAO' && user.email_verified === false
        setKakaoNeedsEmail(needs)
        setServerEmail(user.email || '')
        if (user.name) setInitialName(user.name)
        if (user.nickname) setInitialNickname(user.nickname)
        if (user.phone) setInitialPhone(user.phone)
      })
      .catch(() => {
        if (mounted) router.replace('/login')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <CompleteProfileForm
      kakaoNeedsEmail={kakaoNeedsEmail}
      serverEmail={serverEmail}
      initialName={initialName}
      initialNickname={initialNickname}
      initialPhone={initialPhone}
    />
  )
}

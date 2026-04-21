'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLoginHref } from '@/hooks/useLoginHref'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMe,
  updateProfile,
  logout,
  isAuthenticated,
  sendProfilePhoneSms,
  verifySms,
  checkMeEmailAvailable,
  type UserInfo,
} from '@/services/auth'
import { normalizePhoneKr } from '@/lib/phoneNormalize'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WithdrawModal from './WithdrawModal'

const profileSchema = z.object({
  password: z.string().optional(),
  phone: z.string().min(1, '핸드폰 번호를 입력해주세요.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
  nickname: z.string().min(1, '닉네임을 입력해주세요.'),
  newsletter_agree: z.boolean(),
}).refine((data) => !data.password || data.password.length >= 8, {
  message: '비밀번호는 8자 이상 입력해주세요.',
  path: ['password'],
})

export type ProfileFormData = z.infer<typeof profileSchema>

export type ProfileFormVariant = 'standalone' | 'mypage'

interface ProfileFormProps {
  variant?: ProfileFormVariant
}

const SMS_COOLDOWN_SEC = 30

export default function ProfileForm({ variant = 'standalone' }: ProfileFormProps) {
  const router = useRouter()
  const loginHref = useLoginHref()
  const { setUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [joinedVia, setJoinedVia] = useState<string>('LOCAL')
  const [showPassword, setShowPassword] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const originalPhoneNormRef = useRef<string>('')
  const [verifiedPhoneNorm, setVerifiedPhoneNorm] = useState<string | null>(null)
  const [smsCode, setSmsCode] = useState('')
  const [smsCooldownSec, setSmsCooldownSec] = useState(0)
  const [smsSending, setSmsSending] = useState(false)
  const [verifyingSms, setVerifyingSms] = useState(false)
  const [phoneInlineError, setPhoneInlineError] = useState<string | null>(null)
  /** 소문자 정규화된 이메일 — 중복확인 통과 시에만 값 설정, 입력이 바뀌면 useEffect에서 초기화 */
  const [emailConfirmedLower, setEmailConfirmedLower] = useState<string | null>(null)
  const [emailDupChecking, setEmailDupChecking] = useState(false)
  const originalEmailRef = useRef<string>('')

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      newsletter_agree: false,
    },
  })

  const watchedPhone = watch('phone')

  const normalizedInputPhone = useMemo(
    () => normalizePhoneKr(watchedPhone || ''),
    [watchedPhone],
  )

  /** 저장된 정규화 번호와 입력이 다르면 문자 인증 필요 (최초 번호 등록 포함) */
  const needsPhoneVerification =
    normalizedInputPhone !== originalPhoneNormRef.current

  const phoneChangeOk =
    !needsPhoneVerification ||
    (verifiedPhoneNorm !== null && verifiedPhoneNorm === normalizedInputPhone)

  const applyUserToForm = useCallback(
    (user: UserInfo) => {
      setUserEmail(user.email)
      originalEmailRef.current = (user.email || '').trim()
      setEmailConfirmedLower(null)
      setJoinedVia(user.joined_via || 'LOCAL')
      originalPhoneNormRef.current = normalizePhoneKr(user.phone || '')
      setVerifiedPhoneNorm(null)
      setSmsCode('')
      setPhoneInlineError(null)
      reset({
        password: '',
        phone: user.phone || '',
        name: user.name || '',
        nickname: user.nickname || '',
        newsletter_agree: user.newsletter_agree ?? false,
      })
    },
    [reset],
  )

  const fetchUserInfo = useCallback(async () => {
    setLoadError(false)
    setIsLoadingUser(true)
    try {
      const user = await getMe()
      applyUserToForm(user)
    } catch {
      setLoadError(true)
    } finally {
      setIsLoadingUser(false)
    }
  }, [applyUserToForm])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(loginHref)
      return
    }
    void fetchUserInfo()
  }, [router, fetchUserInfo, loginHref])

  useEffect(() => {
    if (smsCooldownSec <= 0) return
    const t = window.setInterval(() => {
      setSmsCooldownSec((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [smsCooldownSec])

  useEffect(() => {
    if (verifiedPhoneNorm === null) return
    if (normalizedInputPhone !== verifiedPhoneNorm) {
      setVerifiedPhoneNorm(null)
    }
  }, [normalizedInputPhone, verifiedPhoneNorm])

  useEffect(() => {
    const cur = userEmail.trim().toLowerCase()
    if (emailConfirmedLower !== null && cur !== emailConfirmedLower) {
      setEmailConfirmedLower(null)
    }
  }, [userEmail, emailConfirmedLower])

  const handleEmailDuplicateCheck = async () => {
    setError(null)
    const cur = userEmail.trim()
    if (!cur) {
      setError('이메일을 입력해 주세요.')
      return
    }
    if (cur.toLowerCase() === originalEmailRef.current.trim().toLowerCase()) {
      setEmailConfirmedLower(cur.toLowerCase())
      return
    }
    setEmailDupChecking(true)
    try {
      const r = await checkMeEmailAvailable(cur)
      if (r.available) {
        setEmailConfirmedLower(cur.toLowerCase())
      } else {
        setError(r.error || '이미 사용 중인 이메일입니다.')
      }
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'response' in err && err.response && typeof (err.response as any).data?.error === 'string'
          ? (err.response as any).data.error
          : err instanceof Error
            ? err.message
            : '이메일 확인에 실패했습니다.',
      )
    } finally {
      setEmailDupChecking(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setError(null)
    const curEmailLower = userEmail.trim().toLowerCase()
    const origLower = originalEmailRef.current.trim().toLowerCase()
    const emailDirty = curEmailLower !== origLower
    if (emailDirty && curEmailLower !== emailConfirmedLower) {
      setError('이메일을 변경하는 경우 [중복확인]으로 사용 가능 여부를 확인한 뒤 저장해 주세요.')
      return
    }
    if (needsPhoneVerification && !phoneChangeOk) {
      setError('휴대폰 번호를 변경한 경우에는 문자 인증을 완료한 뒤 저장해 주세요.')
      return
    }
    setIsLoading(true)
    try {
      const profileData = {
        email: userEmail,
        phone: data.phone,
        name: data.name,
        nickname: data.nickname,
        position: null,
        birth_year: null,
        birth_month: null,
        birth_day: null,
        region_type: null,
        region_domestic: null,
        region_foreign: null,
        newsletter_agree: data.newsletter_agree,
        ...(joinedVia === 'LOCAL' && data.password?.trim()
          ? { password: data.password.trim() }
          : {}),
      }
      const res = await updateProfile(profileData)
      setSaveSuccess(true)
      if (res.user) {
        setUser(res.user)
        applyUserToForm(res.user)
      } else {
        const u = await getMe()
        setUser(u)
        applyUserToForm(u)
      }
      setValue('password', '')
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'response' in err && err.response && typeof (err.response as any).data?.message === 'string'
          ? (err.response as any).data.message
          : err && typeof err === 'object' && 'response' in err && err.response && typeof (err.response as any).data?.error === 'string'
            ? (err.response as any).data.error
            : err instanceof Error ? err.message : '프로필 수정에 실패했습니다.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  const handleSendSms = async () => {
    setPhoneInlineError(null)
    const phone = watchedPhone?.trim() || ''
    if (!normalizePhoneKr(phone)) {
      setPhoneInlineError('올바른 휴대폰 번호를 입력해 주세요.')
      return
    }
    if (!needsPhoneVerification) {
      setPhoneInlineError('번호를 변경한 경우에만 인증이 필요합니다.')
      return
    }
    try {
      setSmsSending(true)
      await sendProfilePhoneSms(phone)
      setSmsCooldownSec(SMS_COOLDOWN_SEC)
    } catch (e) {
      setPhoneInlineError(e instanceof Error ? e.message : '인증번호 발송에 실패했습니다.')
    } finally {
      setSmsSending(false)
    }
  }

  const handleVerifySms = async () => {
    setPhoneInlineError(null)
    const code = smsCode.replace(/\D/g, '')
    if (code.length !== 6) {
      setPhoneInlineError('6자리 인증번호를 입력해 주세요.')
      return
    }
    const phone = watchedPhone?.trim() || ''
    try {
      setVerifyingSms(true)
      await verifySms(phone, code, { purpose: 'profile_phone' })
      setVerifiedPhoneNorm(normalizePhoneKr(phone))
      setPhoneInlineError(null)
    } catch (e) {
      setPhoneInlineError(e instanceof Error ? e.message : '인증에 실패했습니다.')
    } finally {
      setVerifyingSms(false)
    }
  }

  const joinedViaText = {
    LOCAL: '일반 가입',
    KAKAO: '카카오',
    NAVER: '네이버',
    GOOGLE: '구글',
  }[joinedVia] || '일반 가입'

  const isLocal = joinedVia === 'LOCAL'
  const emailDirtyForDupButton =
    userEmail.trim().toLowerCase() !== originalEmailRef.current.trim().toLowerCase()

  if (isLoadingUser) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
        <p className="text-gray-800">사용자 정보를 불러오지 못했습니다. 네트워크 상태를 확인하거나 다시 시도해 주세요.</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button type="button" onClick={() => void fetchUserInfo()} className="bg-[#e1f800] text-[#111827] hover:bg-[#c9e000]">
            다시 시도
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={loginHref}>로그인으로 이동</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-6 rounded-lg bg-white p-6 shadow"
      onSubmit={handleSubmit(onSubmit)}
    >
      {saveSuccess && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 flex justify-between gap-4 items-start">
          <p className="text-sm text-emerald-900">프로필이 저장되었습니다.</p>
          <button
            type="button"
            className="text-sm text-emerald-800 underline shrink-0"
            onClick={() => setSaveSuccess(false)}
          >
            닫기
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              autoComplete="email"
              className="sm:flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={emailDupChecking || !emailDirtyForDupButton}
              onClick={() => void handleEmailDuplicateCheck()}
            >
              {emailDupChecking ? '확인 중…' : '중복확인'}
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            이메일을 바꾸면 [중복확인] 후 저장할 수 있습니다. 변경 시 인증 메일이 발송될 수 있습니다.
          </p>
          {emailConfirmedLower !== null && userEmail.trim().toLowerCase() === emailConfirmedLower && (
            <p className="mt-1 text-xs text-emerald-700">
              {userEmail.trim().toLowerCase() === originalEmailRef.current.trim().toLowerCase()
                ? '현재 사용 중인 이메일입니다.'
                : '사용 가능한 이메일입니다. 저장 시 반영됩니다.'}
            </p>
          )}
        </div>

        {isLocal && (
          <div>
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 변경 시에만 입력해 주세요."
                {...register('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="joined_via">가입 방법</Label>
          <Input
            id="joined_via"
            type="text"
            value={joinedViaText}
            disabled
            className="mt-1 bg-gray-100"
          />
        </div>

        <div>
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            {...register('name')}
            className="mt-1"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            type="text"
            placeholder="닉네임을 입력하세요"
            {...register('nickname')}
            className="mt-1"
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">휴대폰</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              {...register('phone')}
              className="flex-1"
              disabled={Boolean(needsPhoneVerification && phoneChangeOk)}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db] disabled:opacity-50"
              onClick={() => void handleSendSms()}
              disabled={smsSending || smsCooldownSec > 0 || !needsPhoneVerification || (needsPhoneVerification && phoneChangeOk)}
            >
              {smsSending ? '발송 중…' : smsCooldownSec > 0 ? `${smsCooldownSec}초` : '인증요청'}
            </Button>
          </div>
          {needsPhoneVerification && (
            <p className="mt-1 text-xs text-amber-800">
              번호를 변경하면 문자 인증 후 저장할 수 있습니다.
            </p>
          )}
          {needsPhoneVerification && !phoneChangeOk && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2 flex-wrap items-center">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="인증번호 6자리"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="max-w-[160px]"
                  disabled={phoneChangeOk}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-[#111827] text-white hover:bg-[#1f2937]"
                  onClick={() => void handleVerifySms()}
                  disabled={verifyingSms || phoneChangeOk}
                >
                  {verifyingSms ? '확인 중…' : '인증확인'}
                </Button>
              </div>
            </div>
          )}
          {phoneInlineError && (
            <p className="mt-1 text-sm text-red-600">{phoneInlineError}</p>
          )}
          {phoneChangeOk && needsPhoneVerification && (
            <p className="mt-1 text-xs text-emerald-700">휴대폰 인증이 완료되었습니다.</p>
          )}
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="pt-1">
          <Controller
            name="newsletter_agree"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border border-orange-300 bg-orange-50 text-orange-600 accent-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                <span className="text-sm leading-snug text-gray-900">
                  뉴스레터 및 이벤트/혜택 정보 수신동의
                </span>
              </label>
            )}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          className={`flex-1 ${variant === 'mypage' ? 'bg-[#e1f800] text-[#111827] hover:bg-[#c9e000]' : ''}`}
          disabled={isLoading || (needsPhoneVerification && !phoneChangeOk)}
        >
          {isLoading
            ? '저장 중...'
            : variant === 'mypage'
              ? '회원 정보 수정'
              : '정보 수정'}
        </Button>
        {variant === 'standalone' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="flex-1"
          >
            로그아웃
          </Button>
        )}
      </div>

      {variant === 'mypage' && (
        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setWithdrawModalOpen(true)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            회원 탈퇴
          </button>
        </p>
      )}

      <WithdrawModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        joinedVia={joinedVia as 'LOCAL' | 'KAKAO' | 'NAVER' | 'GOOGLE'}
      />
    </form>
  )
}

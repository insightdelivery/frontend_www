'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  checkSignupEmailAvailable,
  fetchOAuthPendingClaims,
  getOauthPendingTempToken,
  oauthCompleteSignup,
  sendSignupSms,
  verifySignupSms,
} from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
import { loadAllSysCodesOnLogin } from '@/lib/syscode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PROVIDER_LABEL: Record<string, string> = {
  GOOGLE: '구글',
  NAVER: '네이버',
  KAKAO: '카카오',
}

function simpleEmailValid(s: string): boolean {
  const t = s.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

const OAUTH_PLACEHOLDER_EMAIL_DOMAIN = '@oauth-noemail.invalid'

export default function SignupPhonePage() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [claimsLoading, setClaimsLoading] = useState(true)
  const [claimsError, setClaimsError] = useState<string | null>(null)
  const [provider, setProvider] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [newsletterAgree, setNewsletterAgree] = useState(true)
  const originalEmailRef = useRef('')
  const [emailConfirmedLower, setEmailConfirmedLower] = useState<string | null>(null)
  const [emailDupChecking, setEmailDupChecking] = useState(false)

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedForPhone, setVerifiedForPhone] = useState('')
  const [smsHint, setSmsHint] = useState<string | null>(null)
  const [smsFieldError, setSmsFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendingSms, setSendingSms] = useState(false)
  const [verifyingSms, setVerifyingSms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cooldownSec, setCooldownSec] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const temp = getOauthPendingTempToken()
    if (!temp) {
      router.replace('/login?error=OAUTH_FAILED')
      return
    }
    let cancelled = false
    ;(async () => {
      setClaimsLoading(true)
      setClaimsError(null)
      try {
        const c = await fetchOAuthPendingClaims(temp)
        if (cancelled) return
        setProvider(c.provider)
        setEmail(c.email)
        setName(c.name || '')
        setNickname(c.nickname || c.name || '')
        originalEmailRef.current = (c.email || '').trim()
        setEmailConfirmedLower(null)
      } catch (e: unknown) {
        if (!cancelled) {
          setClaimsError(e instanceof Error ? e.message : '가입 정보를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setClaimsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (cooldownSec <= 0) return
    const t = setTimeout(() => setCooldownSec((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearTimeout(t)
  }, [cooldownSec])

  useEffect(() => {
    if (!phoneVerified || !verifiedForPhone) return
    if ((phone || '').trim() !== verifiedForPhone) {
      setPhoneVerified(false)
      setSmsCode('')
      setSmsHint(null)
      setVerifiedForPhone('')
    }
  }, [phone, phoneVerified, verifiedForPhone])

  useEffect(() => {
    const cur = email.trim().toLowerCase()
    if (emailConfirmedLower !== null && cur !== emailConfirmedLower) {
      setEmailConfirmedLower(null)
    }
  }, [email, emailConfirmedLower])

  const emailDirtyForDupButton =
    email.trim().toLowerCase() !== originalEmailRef.current.trim().toLowerCase() ||
    originalEmailRef.current.trim().toLowerCase().endsWith(OAUTH_PLACEHOLDER_EMAIL_DOMAIN)

  const handleEmailDuplicateCheck = async () => {
    setError(null)
    const cur = email.trim()
    if (!cur) {
      setError('이메일을 입력해 주세요.')
      return
    }
    if (!simpleEmailValid(cur)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }
    if (!emailDirtyForDupButton) {
      setEmailConfirmedLower(cur.toLowerCase())
      return
    }
    setEmailDupChecking(true)
    try {
      const r = await checkSignupEmailAvailable(cur)
      if (r.available) {
        setEmailConfirmedLower(cur.toLowerCase())
      } else {
        setError(r.error || '이미 사용 중인 이메일입니다.')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '이메일 확인에 실패했습니다.')
    } finally {
      setEmailDupChecking(false)
    }
  }

  const handleSendSms = useCallback(async () => {
    const p = (phone || '').trim()
    setSmsFieldError(null)
    setSmsHint(null)
    if (!p) {
      setSmsFieldError('휴대폰 번호를 입력해 주세요.')
      return
    }
    setSendingSms(true)
    try {
      await sendSignupSms(p)
      setCooldownSec(30)
      setSmsHint('인증번호를 문자로 발송했습니다. 10분 이내에 입력해 주세요.')
    } catch (e: unknown) {
      const ax = e as {
        response?: { data?: { IndeAPIResponse?: { Message?: string }; error?: string } }
        message?: string
      }
      const msg =
        ax.response?.data?.IndeAPIResponse?.Message ??
        ax.response?.data?.error ??
        (e instanceof Error ? e.message : null) ??
        '인증번호 발송에 실패했습니다.'
      setSmsFieldError(msg)
    } finally {
      setSendingSms(false)
    }
  }, [phone])

  const handleVerifySms = useCallback(async () => {
    const p = (phone || '').trim()
    setSmsFieldError(null)
    if (!p || smsCode.length !== 6) {
      setSmsFieldError('6자리 인증번호를 입력해 주세요.')
      return
    }
    setVerifyingSms(true)
    try {
      await verifySignupSms(p, smsCode)
      setPhoneVerified(true)
      setVerifiedForPhone(p)
      setSmsHint(null)
      setCooldownSec(0)
    } catch (e: unknown) {
      const ax = e as {
        response?: { data?: { IndeAPIResponse?: { Message?: string }; error?: string } }
        message?: string
      }
      const msg =
        ax.response?.data?.IndeAPIResponse?.Message ??
        ax.response?.data?.error ??
        (e instanceof Error ? e.message : null) ??
        '인증에 실패했습니다.'
      setSmsFieldError(msg)
    } finally {
      setVerifyingSms(false)
    }
  }, [phone, smsCode])

  const handleSubmit = async () => {
    setError(null)
    const temp = getOauthPendingTempToken()
    if (!temp) {
      setError('가입 세션이 만료되었습니다. 다시 소셜 로그인을 시도해 주세요.')
      return
    }
    const em = email.trim()
    const nm = name.trim()
    const nick = nickname.trim()
    if (!em || !simpleEmailValid(em)) {
      setError('올바른 이메일을 입력해 주세요.')
      return
    }
    if (em.toLowerCase().endsWith(OAUTH_PLACEHOLDER_EMAIL_DOMAIN)) {
      setError('본인 이메일 주소로 변경한 뒤 [중복확인]을 완료해 주세요.')
      return
    }
    if (!nm) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (!nick) {
      setError('닉네임을 입력해 주세요.')
      return
    }
    const curEmailLower = em.toLowerCase()
    const origLower = originalEmailRef.current.trim().toLowerCase()
    const emailDirty = curEmailLower !== origLower
    if (emailDirty && curEmailLower !== emailConfirmedLower) {
      setError('이메일을 변경한 경우 [중복확인]으로 사용 가능 여부를 확인한 뒤 진행해 주세요.')
      return
    }
    if (!phoneVerified) {
      setError('휴대폰 인증을 완료해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      const result = await oauthCompleteSignup(temp, phone.trim(), {
        email: em,
        name: nm,
        nickname: nick,
        newsletter_agree: newsletterAgree,
      })
      setUser(result.user)
      try {
        await loadAllSysCodesOnLogin()
      } catch {
        // ignore
      }
      router.replace('/?welcome=1')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '가입 완료 처리에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = cn(
    'h-12 rounded-lg border-0 bg-gray-100 text-gray-900 placeholder:text-gray-400',
    'focus-visible:ring-2 focus-visible:ring-gray-300'
  )

  const pv = PROVIDER_LABEL[provider] || '소셜'

  if (claimsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        <p className="mt-4 text-gray-600">가입 정보를 불러오는 중…</p>
      </div>
    )
  }

  if (claimsError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <p className="text-center text-red-700">{claimsError}</p>
        <Button type="button" className="mt-6" variant="outline" onClick={() => router.replace('/login')}>
          로그인으로
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col items-center px-4 py-10 w-full max-w-[450px] mx-auto">
        <div className="text-center mb-8">
          <Image src="/inde_logo1.png" alt="InDe" width={140} height={40} className="mx-auto object-contain" priority />
          <h1 className="mt-6 text-xl font-bold text-gray-900">회원 정보 · 휴대폰 인증</h1>
          <p className="mt-2 text-sm text-gray-600">
            {pv} 계정으로 가입을 마칩니다. 이메일·이름·닉네임을 확인한 뒤 휴대폰 인증을 완료해 주세요.
          </p>
        </div>

        {error && (
          <div className="w-full rounded-lg bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="w-full space-y-5">
          <div>
            <Label htmlFor="sns-email">이메일</Label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="sns-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(inputClass, 'sm:flex-1')}
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0"
                disabled={emailDupChecking || !emailDirtyForDupButton}
                onClick={() => void handleEmailDuplicateCheck()}
              >
                {emailDupChecking ? '확인 중…' : '중복확인'}
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              이메일을 바꾼 경우에만 [중복확인]이 활성화됩니다. 변경 시 반드시 확인 후 가입 완료를 눌러 주세요.
            </p>
            {emailConfirmedLower !== null && email.trim().toLowerCase() === emailConfirmedLower && (
              <p className="mt-1 text-xs text-emerald-700">
                {email.trim().toLowerCase() === originalEmailRef.current.trim().toLowerCase()
                  ? '현재 SNS에서 전달된 이메일과 동일합니다.'
                  : '사용 가능한 이메일입니다.'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sns-name">이름</Label>
            <Input
              id="sns-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(inputClass, 'mt-1')}
            />
          </div>

          <div>
            <Label htmlFor="sns-nickname">닉네임</Label>
            <Input
              id="sns-nickname"
              type="text"
              autoComplete="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={cn(inputClass, 'mt-1')}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={newsletterAgree}
                onChange={(e) => setNewsletterAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              />
              <span>뉴스레터 및 이벤트/혜택 정보 수신동의</span>
            </label>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <Label htmlFor="phone">휴대폰 번호</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="휴대폰 번호 (- 없이)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={phoneVerified}
                className={cn(inputClass, 'flex-1')}
              />
              <Button
                type="button"
                variant="outline"
                disabled={sendingSms || phoneVerified || cooldownSec > 0}
                onClick={handleSendSms}
                className="h-12 shrink-0 px-4"
              >
                {phoneVerified ? '인증완료' : cooldownSec > 0 ? `${cooldownSec}초` : '인증요청'}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="smsCode">인증번호</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="smsCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6자리 인증번호"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={phoneVerified}
                className={cn(inputClass, 'flex-1')}
              />
              <Button
                type="button"
                variant="outline"
                disabled={verifyingSms || phoneVerified || smsCode.length !== 6}
                onClick={handleVerifySms}
                className="h-12 shrink-0 px-4"
              >
                확인
              </Button>
            </div>
            {smsFieldError && <p className="mt-1.5 text-sm text-red-600">{smsFieldError}</p>}
            {smsHint && !smsFieldError && <p className="mt-1.5 text-sm text-green-700">{smsHint}</p>}
          </div>

          <Button
            type="button"
            disabled={submitting || !phoneVerified}
            onClick={() => void handleSubmit()}
            className={cn(
              'w-full h-12 rounded-lg font-bold text-black',
              'bg-[#D4F74C] hover:bg-[#c5e845] focus-visible:ring-gray-400'
            )}
          >
            {submitting ? '처리 중...' : '가입 완료'}
          </Button>
        </div>

        <p className="mt-8 text-sm text-gray-600 text-center">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            로그인으로 돌아가기
          </Link>
        </p>
      </main>
    </div>
  )
}

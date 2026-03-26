'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  getOauthPendingTempToken,
  oauthCompleteSignup,
  sendSignupSms,
  verifySignupSms,
} from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
import { loadAllSysCodesOnLogin } from '@/lib/syscode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function SignupPhonePage() {
  const router = useRouter()
  const { setUser } = useAuth()
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
    if (!getOauthPendingTempToken()) {
      router.replace('/login?error=OAUTH_FAILED')
    }
  }, [router])

  useEffect(() => {
    if (cooldownSec <= 0) return
    const t = setTimeout(() => setCooldownSec((s) => s - 1), 1000)
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
      setSmsHint('인증번호를 문자로 발송했습니다. 3분 이내에 입력해 주세요.')
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
      setSmsHint('휴대폰 인증이 완료되었습니다.')
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
    if (!phoneVerified) {
      setError('휴대폰 인증을 완료해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      const result = await oauthCompleteSignup(temp, phone.trim())
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col items-center px-4 py-10 w-full max-w-[450px] mx-auto">
        <div className="text-center mb-8">
          <Image src="/inde_logo.png" alt="InDe" width={140} height={40} className="mx-auto object-contain" priority />
          <h1 className="mt-6 text-xl font-bold text-gray-900">휴대폰 인증</h1>
          <p className="mt-2 text-sm text-gray-600">
            소셜 계정 연동을 마치려면 휴대폰 번호 인증이 필요합니다.
          </p>
        </div>

        {error && (
          <div className="w-full rounded-lg bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="w-full space-y-4">
          <div>
            <label htmlFor="phone" className="sr-only">
              휴대폰 번호
            </label>
            <div className="flex gap-2">
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
                {cooldownSec > 0 ? `${cooldownSec}초` : '인증요청'}
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="smsCode" className="sr-only">
              인증번호
            </label>
            <div className="flex gap-2">
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
            onClick={handleSubmit}
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

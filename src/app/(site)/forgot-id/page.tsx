'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { findIdByPhone, sendSmsFindId, verifySms } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * 아이디(이메일) 찾기 — userIdPwFindPlan §2
 * /forgot-id → send-sms-find-id → verify-sms → find-id (phoneVerificationAligo.md §2.1)
 */
export default function ForgotIdPage() {
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [emailResult, setEmailResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendingSms, setSendingSms] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [cooldownSec, setCooldownSec] = useState(0)

  useEffect(() => {
    if (cooldownSec <= 0) return
    const t = setTimeout(() => setCooldownSec((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldownSec])

  const handleSendSms = useCallback(async () => {
    const digits = phone.replace(/\D/g, '')
    setError(null)
    if (digits.length < 10 || digits.length > 11) {
      setError('휴대폰 번호를 올바르게 입력해 주세요.')
      return
    }
    setSendingSms(true)
    try {
      await sendSmsFindId(digits)
      setCooldownSec(30)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '인증번호 발송에 실패했습니다.')
    } finally {
      setSendingSms(false)
    }
  }, [phone])

  const handleVerifySms = useCallback(async () => {
    const digits = phone.replace(/\D/g, '')
    setError(null)
    if (digits.length < 10 || smsCode.length !== 6) {
      setError('6자리 인증번호를 입력해 주세요.')
      return
    }
    setVerifying(true)
    try {
      await verifySms(digits, smsCode, { purpose: 'find_id' })
      const { email } = await findIdByPhone(digits)
      setEmailResult(email)
      setCooldownSec(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '인증 또는 조회에 실패했습니다.')
    } finally {
      setVerifying(false)
    }
  }, [phone, smsCode])

  const inputClass = cn(
    'h-12 rounded-lg border-0 bg-gray-100 text-gray-900 placeholder:text-gray-400',
    'focus-visible:ring-2 focus-visible:ring-gray-300'
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px] flex flex-col">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <Image src="/inde_logo1.png" alt="InDe" width={140} height={40} className="mx-auto object-contain" priority />
          </Link>
          <h1 className="mt-6 text-xl font-bold text-gray-900">아이디(이메일) 찾기</h1>
          <p className="mt-2 text-sm text-gray-600">
            이메일 가입(LOCAL) 계정에 등록된 휴대폰만 인증번호가 발송됩니다. SMS·SNS 가입 번호는 안내 메시지가 표시됩니다.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {emailResult ? (
          <div className="rounded-lg bg-gray-50 p-6 text-center space-y-2">
            <p className="text-sm text-gray-600">가입된 이메일</p>
            <p className="text-lg font-semibold text-gray-900 break-all">{emailResult}</p>
            <Button asChild className="mt-4 w-full h-12 rounded-lg font-bold bg-[#D4F74C] text-black hover:bg-[#c5e845]">
              <Link href="/login">로그인하기</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="휴대폰 번호 (- 없이)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                  disabled={verifying}
                  className={cn(inputClass, 'flex-1')}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendingSms || verifying || cooldownSec > 0}
                  onClick={handleSendSms}
                  className="h-12 shrink-0 px-4"
                >
                  {cooldownSec > 0 ? `${cooldownSec}초` : '인증요청'}
                </Button>
              </div>
            </div>
            <div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6자리 인증번호"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={verifying}
                  className={cn(inputClass, 'flex-1')}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={verifying || smsCode.length !== 6}
                  onClick={handleVerifySms}
                  className="h-12 shrink-0 px-3 min-w-[5.5rem] text-sm"
                >
                  {verifying ? '확인 중...' : '확인'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              인증번호가 맞으면 가입 이메일이 바로 표시됩니다.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            로그인으로 돌아가기
          </Link>
        </p>
        </div>
      </main>
    </div>
  )
}

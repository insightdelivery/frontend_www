'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Cookies from 'js-cookie'
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPasswordWithToken,
} from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { clearMemoryAccessToken } from '@/lib/accessTokenMemory'

type Channel = 'email' | 'phone'
type Step = 'input' | 'code' | 'password' | 'done'

/**
 * 비밀번호 재설정 — userIdPwFindPlan §3; 휴대폰 채널은 phoneVerificationAligo.md §2.2 (send-password-reset-code / verify-password-reset-code)
 */
export default function ForgotPasswordPage() {
  const [channel, setChannel] = useState<Channel>('email')
  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const inputClass = cn(
    'h-12 rounded-lg border-0 bg-gray-100 text-gray-900 placeholder:text-gray-400',
    'focus-visible:ring-2 focus-visible:ring-gray-300'
  )

  const tabBtn = (active: boolean) =>
    cn(
      'flex-1 h-11 rounded-lg text-sm font-semibold transition-colors',
      active ? 'bg-[#D4F74C] text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    )

  const handleSendCode = async () => {
    setError(null)
    if (channel === 'email') {
      const em = email.trim()
      if (!em || !em.includes('@')) {
        setError('이메일을 입력해 주세요.')
        return
      }
    } else {
      const raw = phone.replace(/\D/g, '')
      if (raw.length < 10 || raw.length > 11) {
        setError('휴대폰 번호를 올바르게 입력해 주세요.')
        return
      }
    }
    setLoading(true)
    try {
      if (channel === 'email') {
        const em = email.trim()
        const { message } = await sendPasswordResetCode({ email: em })
        setSentMessage(message)
        setStep('code')
      } else {
        const raw = phone.replace(/\D/g, '')
        const { message } = await sendPasswordResetCode({ phone: raw })
        setSentMessage(message)
        setStep('code')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError(null)
    if (code.length !== 6) {
      setError('6자리 인증코드를 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      if (channel === 'email') {
        const em = email.trim()
        const { reset_token } = await verifyPasswordResetCode({ email: em, code })
        setResetToken(reset_token)
      } else {
        const raw = phone.replace(/\D/g, '')
        const { reset_token } = await verifyPasswordResetCode({ phone: raw, code })
        setResetToken(reset_token)
      }
      setStep('password')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '인증에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setError(null)
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('비밀번호는 영문과 숫자를 모두 포함해야 합니다.')
      return
    }
    if (password !== password2) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await resetPasswordWithToken(resetToken, password)
      clearMemoryAccessToken()
      Cookies.remove('accessToken', { path: '/' })
      Cookies.remove('refreshToken', { path: '/' })
      Cookies.remove('userInfo', { path: '/' })
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const hintInput =
    channel === 'email'
      ? '가입 이메일로 인증코드를 보내드립니다.'
      : '가입 시 등록한 휴대폰으로 인증번호를 보내드립니다.'

  const hintCode =
    channel === 'email' ? '메일로 받은 6자리 코드를 입력해 주세요.' : '문자로 받은 6자리 코드를 입력해 주세요.'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px] flex flex-col">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <Image src="/inde_logo1.png" alt="InDe" width={140} height={40} className="mx-auto object-contain" priority />
          </Link>
          <h1 className="mt-6 text-xl font-bold text-gray-900">비밀번호 재설정</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'input' && hintInput}
            {step === 'code' && hintCode}
            {step === 'password' && '새 비밀번호를 입력해 주세요.'}
            {step === 'done' && '비밀번호가 변경되었습니다.'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {step === 'input' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 text-center">인증 방법을 선택한 뒤 정보를 입력해 주세요.</p>
            <div className="flex gap-2">
              <button type="button" className={tabBtn(channel === 'email')} onClick={() => setChannel('email')}>
                이메일
              </button>
              <button type="button" className={tabBtn(channel === 'phone')} onClick={() => setChannel('phone')}>
                휴대폰(SMS)
              </button>
            </div>
            {channel === 'email' ? (
              <Input
                type="email"
                autoComplete="email"
                placeholder="가입 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            ) : (
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                className={inputClass}
              />
            )}
            <p className="text-xs text-gray-500">
              등록된 이메일(일반 가입) 또는 등록 휴대폰(일반 가입)만 인증코드를 보낼 수 있습니다. 이메일은 스팸함도 확인해 주세요.
            </p>
            <Button
              type="button"
              disabled={loading}
              onClick={handleSendCode}
              className="w-full h-12 rounded-lg font-bold text-black bg-[#D4F74C] hover:bg-[#c5e845]"
            >
              {loading ? '처리 중...' : '인증코드 받기'}
            </Button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">{sentMessage || '안내가 전송되었습니다.'}</p>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6자리 인증코드"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={inputClass}
            />
            <Button
              type="button"
              disabled={loading || code.length !== 6}
              onClick={handleVerifyCode}
              className="w-full h-12 rounded-lg font-bold text-black bg-[#D4F74C] hover:bg-[#c5e845]"
            >
              {loading ? '확인 중...' : '인증 확인'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('input')
                setCode('')
                setError(null)
              }}
            >
              {channel === 'email' ? '이메일 다시 입력' : '휴대폰 번호 다시 입력'}
            </Button>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-4">
            <Input
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="새 비밀번호 (8자 이상, 영문+숫자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <Input
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="새 비밀번호 확인"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
              비밀번호 표시
            </label>
            <Button
              type="button"
              disabled={loading}
              onClick={handleResetPassword}
              className="w-full h-12 rounded-lg font-bold text-black bg-[#D4F74C] hover:bg-[#c5e845]"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <p className="text-gray-700">새 비밀번호로 로그인해 주세요.</p>
            <Button asChild className="w-full h-12 rounded-lg font-bold bg-[#D4F74C] text-black hover:bg-[#c5e845]">
              <Link href="/login">로그인하기</Link>
            </Button>
          </div>
        )}

        {step !== 'done' && (
          <p className="mt-8 text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              로그인으로 돌아가기
            </Link>
          </p>
        )}
        </div>
      </main>
    </div>
  )
}

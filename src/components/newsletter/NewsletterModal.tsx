'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import { Check, X } from 'lucide-react'
import apiClient from '@/lib/axios'

type Props = {
  open: boolean
  onClose: () => void
}

/** 예: 2026. 5. 1. 12:59 오전 (로컬 시각) */
function formatSubscriptionCompletedAt(d: Date): string {
  const y = d.getFullYear()
  const mo = d.getMonth() + 1
  const day = d.getDate()
  const h24 = d.getHours()
  const min = d.getMinutes()
  const ampm = h24 < 12 ? '오전' : '오후'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  const mm = String(min).padStart(2, '0')
  return `${y}. ${mo}. ${day}. ${h12}:${mm} ${ampm}`
}

export default function NewsletterModal({ open, onClose }: Props) {
  const titleId = useId()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'err'; text: string } | null>(null)
  const [success, setSuccess] = useState(false)
  const [completedAt, setCompletedAt] = useState<Date | null>(null)

  const handleClose = useCallback(() => {
    setSuccess(false)
    setCompletedAt(null)
    setMessage(null)
    setEmail('')
    setName('')
    setAgreePrivacy(false)
    setAgreeMarketing(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, handleClose])

  useEffect(() => {
    if (!open) return
    setMessage(null)
    setSuccess(false)
    setCompletedAt(null)
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!agreePrivacy || !agreeMarketing) {
      setMessage({ type: 'err', text: '필수 동의 항목에 동의해 주세요.' })
      return
    }
    setSubmitting(true)
    try {
      const { data } = await apiClient.post<{
        b2n2027ApiResponse?: { ErrorCode?: string; Message?: string }
        IndeAPIResponse?: { ErrorCode?: string; Message?: string }
      }>('/api/newsletter/subscribe', {
        email: email.trim(),
        name: name.trim(),
        agreePrivacy,
        agreeMarketing,
      })
      const wrap = data?.b2n2027ApiResponse
      if (wrap?.ErrorCode === '00') {
        setCompletedAt(new Date())
        setSuccess(true)
        setEmail('')
        setName('')
        setAgreePrivacy(false)
        setAgreeMarketing(false)
        return
      }
      setMessage({ type: 'err', text: wrap?.Message || '처리에 실패했습니다.' })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; IndeAPIResponse?: { Message?: string } } } }
      const msg =
        ax.response?.data?.error ||
        ax.response?.data?.IndeAPIResponse?.Message ||
        '이미 구독된 이메일입니다.'
      setMessage({ type: 'err', text: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="닫기" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-6 py-5">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            인디 뉴스레터 구독
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="모달 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {success ? (
          <div
            className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[360px] sm:py-16"
            role="status"
            aria-live="polite"
          >
            <div
              className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-white sm:mb-8 sm:h-[72px] sm:w-[72px]"
              aria-hidden
            >
              <Check className="h-9 w-9 text-black sm:h-10 sm:w-10" strokeWidth={2.5} />
            </div>
            <p className="text-lg font-medium text-gray-900 sm:text-xl">구독해 주셔서 감사합니다.</p>
            {completedAt ? (
              <p className="mt-4 text-sm text-gray-600 sm:mt-5">{formatSubscriptionCompletedAt(completedAt)}</p>
            ) : null}
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-8 sm:py-10">
          <div className="mb-10 flex justify-center sm:mb-12">
            <img
              src="/inde_logo.png"
              alt="InDe"
              className="h-auto max-h-14 w-auto max-w-[220px] object-contain sm:max-h-16 sm:max-w-[260px]"
            />
          </div>
          <div className="mb-10 space-y-5 text-sm leading-[1.75] text-gray-600 sm:mb-12">
            <p className="text-[15px] font-semibold text-gray-800">복음은 실전이다, 크리스천 인사이트 루틴</p>
            <p>
              InDe에서 발행되는 시의적이고도 핫한 콘텐츠 소식을 받아보세요.
              <br />
              여러분의 신앙 인사이트 루틴 형성을 도와드립니다!
            </p>
            <p className="text-sm text-gray-500">매주 월요일 메일함에서 만나요 :)</p>
          </div>
          <div className="mb-8 space-y-3 sm:mb-5">
            <label className="block text-sm font-medium text-gray-800">
              이메일 주소<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3.5 text-sm outline-none transition-colors focus:border-gray-400"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="mb-10 space-y-3 sm:mb-5">
            <label className="block text-sm font-medium text-gray-800">이름/닉네임</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3.5 text-sm outline-none transition-colors focus:border-gray-400"
              placeholder="이름 (선택)"
              maxLength={100}
            />
          </div>
          <div className="mb-8 space-y-1 border-t border-gray-100 pt-1 sm:mb-10 sm:pt-1">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-gray-700">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
              />
              <span>(필수) 개인정보 처리 동의</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-gray-700">
              <input
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => setAgreeMarketing(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
              />
              <span>(필수) 광고성 정보 수신 동의</span>
            </label>
          </div>
          {message ? (
            <p className="mb-6 text-sm text-red-600 sm:mb-8" role="alert">
              {message.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gray-900 py-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 sm:py-[1.125rem]"
          >
            {submitting ? '처리 중…' : '구독하기'}
          </button>
        </form>
        )}
      </div>
    </div>
  )
}

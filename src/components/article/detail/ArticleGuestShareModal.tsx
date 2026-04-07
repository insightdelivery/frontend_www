'use client'

/**
 * 비회원 공유 — contentShareLinkCopy.md §1.2 (현재 URL만, short 미발급)
 * 회원 전용 UI(§7.5)와 구분하여 동일 제목으로 안내 모달만 연다.
 */
import { useRef } from 'react'
import Link from 'next/link'
import { Copy, Info, LogIn } from 'lucide-react'
import { postShare, type ContentType } from '@/services/libraryUseractivity'

const DEBOUNCE_MS = 2000

export interface ArticleGuestShareModalProps {
  open: boolean
  onClose: () => void
  contentCode: string
  /** 기본 ARTICLE — 비디오·세미나는 VIDEO / SEMINAR */
  contentType?: ContentType
  /** 복사 성공 후 (토스트 등) */
  onCopied?: () => void
}

export default function ArticleGuestShareModal({
  open,
  onClose,
  contentCode,
  contentType = 'ARTICLE',
  onCopied,
}: ArticleGuestShareModalProps) {
  const lastLogAt = useRef(0)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '')
      const now = Date.now()
      if (now - lastLogAt.current >= DEBOUNCE_MS) {
        lastLogAt.current = now
        postShare(contentType, contentCode).catch(() => {})
      }
      onCopied?.()
      onClose()
    } catch {
      // ignore
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-share-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="guest-share-title"
          className="mb-5 text-[22px] font-black leading-tight tracking-tight text-[#0f172a] sm:mb-6"
        >
          인사이트 확장하기!
        </h2>

        <div className="mb-6 flex gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={2} aria-hidden />
          <p className="text-[15px] leading-relaxed text-[#475569]">
            비회원은 <strong className="font-semibold text-[#0f172a]">현재 페이지 주소</strong>만 복사할 수 있습니다.
            <br />로그인 후, 링크를 복사하면 전체 내용을 공유할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          현재 페이지 링크 복사
        </button>

        <Link
          href="/login"
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50/90 py-3.5 text-[14px] font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-100"
        >
          <LogIn className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          로그인 하기
        </Link>

        <button
          type="button"
          className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-[15px] font-bold text-[#0f172a] shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  )
}

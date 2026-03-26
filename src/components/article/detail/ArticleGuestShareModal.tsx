'use client'

/**
 * 비회원 공유 — contentShareLinkCopy.md §1.2 (현재 URL만, short 미발급)
 * 회원 전용 UI(§7.5)와 구분하여 동일 제목으로 안내 모달만 연다.
 */
import { useRef } from 'react'
import Link from 'next/link'
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
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="guest-share-title" className="font-black text-[20px] text-[#0f172a] mb-3">
          인사이트 확장하기!
        </h2>
        <p className="text-[15px] text-[#475569] mb-4 leading-relaxed">
          비회원은 <strong className="text-[#0f172a]">현재 페이지 주소</strong>만 복사할 수 있습니다. 회원 로그인 시{' '}
          <strong className="text-[#0f172a]">24시간 유효 short 공유 링크</strong>를 발급할 수 있습니다.
        </p>
        <button
          type="button"
          className="w-full bg-black text-white text-[15px] font-bold py-3 rounded-xl hover:opacity-90 mb-3"
          onClick={handleCopy}
        >
          현재 페이지 링크 복사
        </button>
        <p className="text-center text-[14px] mb-4">
          <Link href="/login" className="text-[#2563eb] underline font-medium">
            로그인 후 short 링크 발급
          </Link>
        </p>
        <button type="button" className="w-full text-[14px] text-[#64748b] hover:underline" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}

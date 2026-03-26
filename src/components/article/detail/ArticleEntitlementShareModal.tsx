'use client'

/**
 * 공유 유입 비회원 — §10.16 short URL 복사 (for-copy API + share_token 검증)
 * 「비회원」만으로 short 복사 금지(§10.16.0.2) — 서버 eligible일 때만 short.
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { fetchShareForCopy } from '@/services/contentShare'
import { postShare } from '@/services/libraryUseractivity'
import { buildShortSharePageUrl } from '@/lib/shareUrl'

const DEBOUNCE_MS = 2000

export interface ArticleEntitlementShareModalProps {
  open: boolean
  onClose: () => void
  contentCode: string
  onCopied?: () => void
}

export default function ArticleEntitlementShareModal({
  open,
  onClose,
  contentCode,
  onCopied,
}: ArticleEntitlementShareModalProps) {
  const lastLogAt = useRef(0)
  const [loading, setLoading] = useState(false)
  const [shortCode, setShortCode] = useState<string | null>(null)
  const [eligible, setEligible] = useState<boolean | null>(null)

  useEffect(() => {
    if (!open) {
      setShortCode(null)
      setEligible(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setEligible(null)
    setShortCode(null)
    fetchShareForCopy('ARTICLE', contentCode)
      .then((r) => {
        if (cancelled) return
        if (r.eligible && r.shortCode) {
          setEligible(true)
          setShortCode(r.shortCode)
        } else {
          setEligible(false)
          setShortCode(null)
        }
      })
      .catch(() => {
        if (!cancelled) setEligible(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, contentCode])

  const fireShareLog = () => {
    const now = Date.now()
    if (now - lastLogAt.current < DEBOUNCE_MS) return
    lastLogAt.current = now
    postShare('ARTICLE', contentCode).catch(() => {})
  }

  const handleCopyShort = async () => {
    if (!shortCode) return
    try {
      await navigator.clipboard.writeText(buildShortSharePageUrl(shortCode))
      fireShareLog()
      onCopied?.()
      onClose()
    } catch {
      // ignore
    }
  }

  const handleCopyFallback = async () => {
    try {
      await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '')
      fireShareLog()
      onCopied?.()
      onClose()
    } catch {
      // ignore
    }
  }

  if (!open) return null

  const shareUrl = shortCode ? buildShortSharePageUrl(shortCode) : ''

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entitlement-share-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="entitlement-share-title" className="font-black text-[20px] text-[#0f172a] mb-3">
          인사이트 확장하기!
        </h2>

        {loading && (
          <p className="text-[15px] text-[#64748b] mb-4">링크 확인 중…</p>
        )}

        {!loading && eligible === true && shortCode && (
          <>
            <p className="text-[15px] text-[#475569] mb-3 leading-relaxed">
              아래 <strong className="text-[#0f172a]">공유 링크</strong>를 복사해 전달할 수 있습니다.
            </p>
            <p className="text-[12px] text-[#64748b] break-all mb-4 p-2 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              {shareUrl}
            </p>
            <button
              type="button"
              className="w-full bg-black text-white text-[15px] font-bold py-3 rounded-xl hover:opacity-90 mb-3"
              onClick={handleCopyShort}
            >
              공유 링크 복사
            </button>
          </>
        )}

        {!loading && eligible === false && (
          <>
            <p className="text-[15px] text-[#475569] mb-4 leading-relaxed">
              공유 링크가 만료되어 <strong className="text-[#0f172a]">일반 주소</strong>가 복사됩니다.
            </p>
            <button
              type="button"
              className="w-full bg-black text-white text-[15px] font-bold py-3 rounded-xl hover:opacity-90 mb-3"
              onClick={handleCopyFallback}
            >
              현재 페이지 링크 복사
            </button>
          </>
        )}

        <p className="text-center text-[14px] mb-2">
          <Link href="/login" className="text-[#2563eb] underline font-medium">
            로그인 후 새 short 링크 발급
          </Link>
        </p>
        <button type="button" className="w-full text-[14px] text-[#64748b] hover:underline" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}

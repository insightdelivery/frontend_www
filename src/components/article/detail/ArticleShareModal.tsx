'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureShareLink, type ShareEnsureResult } from '@/services/contentShare'
import { postShare, type ContentType } from '@/services/libraryUseractivity'
import { buildShortSharePageUrl } from '@/lib/shareUrl'

export interface ArticleShareModalProps {
  open: boolean
  onClose: () => void
  contentCode: string
  /** 기본 ARTICLE — 비디오·세미나 상세는 VIDEO / SEMINAR */
  contentType?: ContentType
}

function formatRemainingMs(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
}

/** §7.4 — SHARE 로그 스팸 완화 */
const SHARE_LOG_DEBOUNCE_MS = 2000

export default function ArticleShareModal({
  open,
  onClose,
  contentCode,
  contentType = 'ARTICLE',
}: ArticleShareModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ShareEnsureResult | null>(null)
  const [, setTick] = useState(0)
  const lastShareLogAt = useRef(0)
  /** 같은 expiredAt에 대해 자동 갱신 1회만 (§7.5 remaining<=0) */
  const autoRenewedForExpiredAt = useRef<string | null>(null)

  const runEnsure = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await ensureShareLink(contentType, contentCode)
      setData(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : '링크를 불러오지 못했습니다.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [contentCode, contentType])

  useEffect(() => {
    if (!open) {
      setData(null)
      setError(null)
      setLoading(false)
      autoRenewedForExpiredAt.current = null
      return
    }
    autoRenewedForExpiredAt.current = null
    runEnsure()
  }, [open, runEnsure])

  const mode = data?.mode
  const expiredAt = data?.expiredAt
  const shortCode = data?.shortCode ?? ''
  const shareUrl = shortCode ? buildShortSharePageUrl(shortCode) : ''

  useEffect(() => {
    if (!open || mode !== 'active' || !expiredAt) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [open, mode, expiredAt])

  const displayRemainingMs =
    expiredAt && mode === 'active' ? new Date(expiredAt).getTime() - Date.now() : 0

  useEffect(() => {
    if (!open || mode !== 'active' || !expiredAt) return
    if (displayRemainingMs > 0) return
    if (autoRenewedForExpiredAt.current === expiredAt) return
    autoRenewedForExpiredAt.current = expiredAt
    runEnsure()
  }, [open, mode, expiredAt, displayRemainingMs, runEnsure])

  const isStateB = mode === 'active' && displayRemainingMs > 0
  const isStateA = mode === 'issued' || mode === 'renewed'
  const needsManualRenew =
    mode === 'active' && displayRemainingMs <= 0 && autoRenewedForExpiredAt.current === expiredAt && !loading

  const fireShareLog = useCallback(() => {
    const now = Date.now()
    if (now - lastShareLogAt.current < SHARE_LOG_DEBOUNCE_MS) return
    lastShareLogAt.current = now
    postShare(contentType, contentCode).catch(() => {})
  }, [contentCode, contentType])

  const handleCopy = async () => {
    if (!shareUrl || !isStateA) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      fireShareLog()
      onClose()
    } catch {
      setError('클립보드 복사에 실패했습니다.')
    }
  }

  const handleManualRenew = () => {
    runEnsure()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="share-modal-title" className="font-black text-[20px] text-[#0f172a] mb-4">
          인사이트 확장하기!
        </h2>

        {loading && <p className="text-[14px] text-[#64748b]">불러오는 중…</p>}
        {error && !loading && <p className="text-[14px] text-red-600 mb-2">{error}</p>}

        {!loading && data && isStateB && (
          <div className="space-y-3">
            <p className="text-[15px] text-[#0f172a]">이미 공유 링크가 생성되었습니다.</p>
            <p className="text-[14px] font-mono text-[#475569]">
              남은 시간: {formatRemainingMs(displayRemainingMs)}
            </p>
          </div>
        )}

        {!loading && data && isStateA && (
          <div className="space-y-4">
            <p className="text-[13px] text-[#64748b] break-all">{shareUrl || '—'}</p>
            <button
              type="button"
              className="w-full bg-black text-white text-[15px] font-bold py-3 rounded-xl hover:opacity-90"
              onClick={handleCopy}
              disabled={!shareUrl}
            >
              복사하기
            </button>
          </div>
        )}

        {!loading && needsManualRenew && (
          <div className="space-y-3">
            <p className="text-[14px] text-[#64748b]">링크를 갱신할 수 없습니다. 다시 시도해 주세요.</p>
            <button
              type="button"
              className="w-full bg-black text-white text-[15px] font-bold py-3 rounded-xl hover:opacity-90"
              onClick={handleManualRenew}
            >
              다시 시도
            </button>
          </div>
        )}

        <button
          type="button"
          className="mt-6 w-full text-[14px] text-[#64748b] hover:underline"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  )
}

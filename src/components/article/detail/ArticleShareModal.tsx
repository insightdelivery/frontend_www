'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, Copy } from 'lucide-react'
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
  /** 만료 시점(expiredAt)마다 자동 갱신 1회만 시도 — 실패 시 ref 해제해 수동 재시도 가능 */
  const renewAttemptForExpiredAt = useRef<string | null>(null)

  const runEnsure = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await ensureShareLink(contentType, contentCode)
      setData(r)
      renewAttemptForExpiredAt.current = null
    } catch (e) {
      setError(e instanceof Error ? e.message : '링크를 불러오지 못했습니다.')
      // 갱신 실패 시에도 기존 응답 유지 → mode·만료 시각 유지, 다시 시도 UI 표시 가능
      setData((prev) => prev)
      renewAttemptForExpiredAt.current = null
    } finally {
      setLoading(false)
    }
  }, [contentCode, contentType])

  useEffect(() => {
    if (!open) {
      setData(null)
      setError(null)
      setLoading(false)
      renewAttemptForExpiredAt.current = null
      return
    }
    renewAttemptForExpiredAt.current = null
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

  /** 유효시간 종료 후: 서버가 기존 행을 UPDATE해 새 shortCode·만료 시각 발급(§5.3) — 자동 1회 */
  useEffect(() => {
    if (!open || mode !== 'active' || !expiredAt) return
    if (displayRemainingMs > 0) return
    if (loading) return
    if (error) return
    if (renewAttemptForExpiredAt.current === expiredAt) return
    renewAttemptForExpiredAt.current = expiredAt
    void runEnsure()
  }, [open, mode, expiredAt, displayRemainingMs, loading, error, runEnsure])

  const isStateB = mode === 'active' && displayRemainingMs > 0
  const isStateA = mode === 'issued' || mode === 'renewed'
  /** 자동 갱신 실패 후: 만료된 채로 링크 재발급 필요 */
  const needsManualRenew =
    Boolean(data) &&
    mode === 'active' &&
    displayRemainingMs <= 0 &&
    !loading &&
    Boolean(error)

  const fireShareLog = useCallback(() => {
    const now = Date.now()
    if (now - lastShareLogAt.current < SHARE_LOG_DEBOUNCE_MS) return
    lastShareLogAt.current = now
    postShare(contentType, contentCode).catch(() => {})
  }, [contentCode, contentType])

  /** State A·B 공통 — API가 준 `shortCode`로 만든 URL만 복사(추가 발급 요청 없음) */
  const handleCopyUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      fireShareLog()
      onClose()
    } catch {
      setError('클립보드 복사에 실패했습니다.')
    }
  }

  const handleManualRenew = () => {
    renewAttemptForExpiredAt.current = null
    void runEnsure()
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
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="share-modal-title" className="mb-5 text-[22px] font-black leading-tight tracking-tight text-[#0f172a] sm:mb-6">
          인사이트 확장하기!
        </h2>

        {loading && (
          <p className="text-[15px] text-[#64748b]" role="status">
            불러오는 중…
          </p>
        )}
        {error && !loading && !needsManualRenew && (
          <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[14px] text-red-700">{error}</p>
        )}

        {!loading && data && isStateB && (
          <div className="space-y-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
              <p className="text-[15px] font-semibold leading-snug text-[#0f172a]">
                이미 공유 링크가 생성되었습니다.
              </p>
            </div>

            {shareUrl ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
                <p className="mb-2 text-[12px] font-semibold tracking-wide text-[#64748b]">공유 링크</p>
                <p className="mb-3 break-all text-[13px] leading-relaxed text-[#0f172a]">{shareUrl}</p>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-[15px] font-bold text-white shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  onClick={handleCopyUrl}
                >
                  <Copy className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                  복사하기
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
              <Clock className="h-4 w-4 shrink-0 text-[#64748b]" strokeWidth={2} aria-hidden />
              <span className="text-[13px] font-medium text-[#64748b]">남은 시간</span>
              <span className="min-w-[7.5rem] flex-1 text-right font-mono text-[18px] font-semibold tabular-nums text-[#0f172a] sm:text-[20px]">
                {formatRemainingMs(displayRemainingMs)}
              </span>
            </div>
          </div>
        )}

        {!loading && data && isStateA && (
          <div className="space-y-4">
            <p className="break-all text-[13px] text-[#64748b]">{shareUrl || '—'}</p>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-[15px] font-bold text-white shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-50"
              onClick={handleCopyUrl}
              disabled={!shareUrl}
            >
              <Copy className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              복사하기
            </button>
          </div>
        )}

        {!loading && needsManualRenew && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-[14px] leading-relaxed text-[#92400e]">
              공유 링크 유효 시간이 지났습니다. 새 링크를 발급하려면 아래를 눌러 주세요. (이전 short 링크는 더 이상
              사용되지 않습니다.)
            </p>
            <button
              type="button"
              className="w-full rounded-xl bg-black py-3 text-[15px] font-bold text-white shadow-sm transition hover:opacity-90"
              onClick={handleManualRenew}
            >
              새 공유 링크 발급하기
            </button>
          </div>
        )}

        <button
          type="button"
          className="mt-6 w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-[15px] font-bold text-[#0f172a] shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  )
}

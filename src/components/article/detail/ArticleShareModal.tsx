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

/**
 * API expiredAt는 백엔드 UTC(DATETIME) 직렬화. 오프셋 없으면 로컬로 파싱되어
 * 남은 시간이 음수로 떨어지고 silent renew가 반복될 수 있음 → 없으면 Z(UTC)로 해석.
 */
function parseApiExpiredAtMs(iso: string): number {
  const s = (iso || '').trim()
  if (!s) return NaN
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)
  const normalized = hasTz ? s : `${s}Z`
  return new Date(normalized).getTime()
}

function isExpiredAtInPast(iso: string): boolean {
  const t = parseApiExpiredAtMs(iso)
  if (!Number.isFinite(t)) return false
  return t <= Date.now()
}

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
  /** 만료 응답 시 조용히 ensure 재시도(서버가 새 링크 발급할 때까지) — 무한 방지 상한 */
  const silentRenewAttemptsRef = useRef(0)
  const MAX_SILENT_ENSURE = 12

  const runEnsure = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await ensureShareLink(contentType, contentCode)
      setData(r)
      // 무한 ensure 방지: 자동 갱신 effect가 ref를 expiredAt에 맞춘 뒤 호출한 runEnsure가 "여전히 만료" 응답이면 ref 유지.
      // 최초 오픈 시 runEnsure는 ref가 null → 아래 조건 불충족 → null 유지 → effect가 1회 자동 갱신 가능.
      const stillExpired = r.mode === 'active' && Boolean(r.expiredAt) && isExpiredAtInPast(r.expiredAt)
      if (stillExpired && renewAttemptForExpiredAt.current === r.expiredAt) {
        renewAttemptForExpiredAt.current = r.expiredAt
      } else {
        renewAttemptForExpiredAt.current = null
      }
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
      silentRenewAttemptsRef.current = 0
      return
    }
    renewAttemptForExpiredAt.current = null
    silentRenewAttemptsRef.current = 0
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

  const expiredAtMs = expiredAt ? parseApiExpiredAtMs(expiredAt) : NaN
  const displayRemainingMs =
    expiredAt && mode === 'active' && Number.isFinite(expiredAtMs)
      ? expiredAtMs - Date.now()
      : 0

  /** 미만료: UTC 기준 만료 시각이 아직 미래. 파싱 실패 시 서버 active·shortCode면 표시(카운트다운만 0) */
  const isActiveLinkUsable =
    mode === 'active' &&
    Boolean(shortCode) &&
    Boolean(expiredAt) &&
    (Number.isFinite(expiredAtMs) ? expiredAtMs > Date.now() : true)

  const isStateB = isActiveLinkUsable
  const isStateA = mode === 'issued' || mode === 'renewed'

  /** 서버가 active인데 UTC 기준 만료가 이미 지난 경우만 재발급(로컬 파싱 오류로 연속 호출되던 것 방지) */
  const shouldSilentRenew =
    Boolean(data) &&
    mode === 'active' &&
    !loading &&
    !error &&
    typeof expiredAt === 'string' &&
    isExpiredAtInPast(expiredAt)

  useEffect(() => {
    if (!shouldSilentRenew) return
    if (silentRenewAttemptsRef.current >= MAX_SILENT_ENSURE) {
      setError('공유 링크를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    silentRenewAttemptsRef.current += 1
    renewAttemptForExpiredAt.current = null
    void runEnsure()
  }, [shouldSilentRenew, loading, expiredAt, shortCode, runEnsure])

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
        {error && !loading && (
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
            <p className="text-[15px] font-medium leading-relaxed text-[#0f172a]">
              24시간 공유 링크로 인사이트와 복음을 나눠보세요!
            </p>
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

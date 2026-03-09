'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMeViews, type ActivityLogItem, type ContentType } from '@/services/libraryUseractivity'

const PAGE_SIZE = 12

function contentHref(contentType: ContentType, contentCode: string): string {
  switch (contentType) {
    case 'ARTICLE':
      return `/article/detail?id=${encodeURIComponent(contentCode)}`
    case 'VIDEO':
      return `/video/detail?id=${encodeURIComponent(contentCode)}`
    case 'SEMINAR':
      return `/seminar/detail?id=${encodeURIComponent(contentCode)}`
    default:
      return '#'
  }
}

function contentTypeLabel(contentType: ContentType): string {
  return { ARTICLE: '아티클', VIDEO: '비디오', SEMINAR: '세미나' }[contentType] ?? contentType
}

function formatDate(regDateTime: string | null): string {
  if (!regDateTime) return ''
  try {
    const d = new Date(regDateTime)
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')
  } catch {
    return regDateTime
  }
}

export default function MypageLibraryPage() {
  const [list, setList] = useState<ActivityLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMeViews({ page, page_size: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setList(res.list)
          setTotal(res.total)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col">
      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-[#6b7280]">최근 본 콘텐츠를 불러오는 중...</p>
        </div>
      ) : list.length === 0 ? (
        <p className="py-12 text-center text-[#6b7280]">최근 본 콘텐츠가 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <article
                key={item.publicUserActivityLogId}
                className="flex flex-col overflow-hidden rounded-xl border border-[#f1f5f9] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-col gap-4">
                  <span className="w-fit rounded-[2px] bg-[#f1f5f9] px-2 py-1 text-[10px] font-black uppercase tracking-[0.5px] text-[#475569]">
                    {contentTypeLabel(item.contentType)}
                  </span>
                  <div className="h-[195px] w-full rounded-lg bg-[#f1f5f9]" aria-hidden />
                  <h3 className="text-[18px] font-bold leading-[24.75px] text-[#0f172a]">
                    {item.title || `${item.contentCode}`}
                  </h3>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[12px] leading-4 text-[#94a3b8]">
                      {formatDate(item.regDateTime)}
                    </span>
                    <Link
                      href={contentHref(item.contentType, item.contentCode)}
                      className="rounded bg-[#e1f800] px-2 py-1 text-[12px] font-bold text-black"
                    >
                      콘텐츠 보기
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-20 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-50"
                aria-label="이전"
              >
                <span className="text-[#475569]">‹</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : Math.max(1, page - 2 + i)
                if (p > totalPages) return null
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-[16px] ${
                      p === page
                        ? 'bg-[#e1f800] font-bold text-black'
                        : 'border border-transparent font-medium text-[#475569]'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-50"
                aria-label="다음"
              >
                <span className="text-[#475569]">›</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

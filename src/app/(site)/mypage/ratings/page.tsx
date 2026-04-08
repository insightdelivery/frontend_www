'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getMeRatings, type ActivityLogItem, type ContentType } from '@/services/libraryUseractivity'
import WwwPagination from '@/components/common/WwwPagination'

/** 리스트는 페이지당 최대 7건 (userStarScore.md) */
const PAGE_SIZE = 7

type SortType = 'latest' | 'high' | 'low'

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

function formatDate(regDateTime: string | null): string {
  if (!regDateTime) return ''
  try {
    const d = new Date(regDateTime)
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
  } catch {
    return regDateTime
  }
}

function stars(rating: number): string {
  return '★'.repeat(Math.min(5, Math.max(0, Math.round(rating))))
}

/** 요약 카드 평균 점수 시각화 (0~5, 소수 반영) */
function AverageStars({ value }: { value: number }) {
  const v = Math.min(5, Math.max(0, value))
  return (
    <div className="flex gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(1, Math.max(0, v - (i - 1)))
        return (
          <div
            key={i}
            className="relative h-5 w-5 shrink-0 text-[20px] leading-none"
          >
            <span className="absolute left-0 top-0 text-[#e2e8f0]">★</span>
            <div
              className="absolute left-0 top-0 h-full overflow-hidden text-[#e1f800]"
              style={{ width: `${fill * 100}%` }}
            >
              <span className="inline-block w-5">★</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function contentTypeLabel(contentType: ContentType): string {
  return { ARTICLE: '아티클', VIDEO: '비디오', SEMINAR: '세미나' }[contentType] ?? contentType
}

export default function MypageRatingsPage() {
  const [sort, setSort] = useState<SortType>('latest')
  const [list, setList] = useState<ActivityLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [summary, setSummary] = useState<{
    avgRating: number
    totalCount: number
    distribution: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sortParam =
    sort === 'high'
      ? 'rating_desc'
      : sort === 'low'
        ? 'rating_asc'
        : 'regDateTime_desc'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMeRatings({ page, page_size: PAGE_SIZE, sort: sortParam })
      .then((res) => {
        if (!cancelled) {
          setList(res.list)
          setTotal(res.total)
          if (res.summary) setSummary(res.summary)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, sortParam])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const avgRating = summary?.avgRating ?? 0
  const totalCount = summary?.totalCount ?? 0
  const dist = summary?.distribution ?? { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  const distributionWithPercent = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: dist[String(stars)] ?? 0,
    percent: totalCount > 0 ? Math.round(((dist[String(stars)] ?? 0) / totalCount) * 100) : 0,
  }))

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <aside className="w-full shrink-0 rounded-2xl bg-[#f8fafc] p-8 lg:w-[384px]">
        <div className="flex flex-col items-center gap-8">
          <p className="text-[60px] font-black leading-[60px] text-[#0f172a]">{avgRating}</p>
          <AverageStars value={avgRating} />
          <p className="text-center text-[16px] leading-6 text-[#64748b]">
            총 <span className="font-bold text-[#0f172a]">{totalCount}개</span>의 별점
          </p>
          <div className="flex w-full flex-col gap-3">
            {distributionWithPercent.map(({ stars: s, percent }) => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-[14px] font-medium text-[#0f172a]">{s}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div
                    className="h-full rounded-full bg-[#e1f800]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[12px] leading-4 text-[#94a3b8]">
                  {percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col gap-6">
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setSort('latest')
              setPage(1)
            }}
            className={`border-b-2 pb-0.5 text-[14px] font-semibold leading-5 ${
              sort === 'latest' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b]'
            }`}
          >
            최신순
          </button>
          <button
            type="button"
            onClick={() => {
              setSort('high')
              setPage(1)
            }}
            className={`border-b-2 pb-0.5 text-[14px] font-semibold leading-5 ${
              sort === 'high' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b]'
            }`}
          >
            별점 높은순
          </button>
          <button
            type="button"
            onClick={() => {
              setSort('low')
              setPage(1)
            }}
            className={`border-b-2 pb-0.5 text-[14px] font-semibold leading-5 ${
              sort === 'low' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b]'
            }`}
          >
            별점 낮은순
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-[#6b7280]">별점 목록을 불러오는 중...</p>
          </div>
        ) : list.length === 0 ? (
          <p className="py-12 text-center text-[#6b7280]">남긴 별점이 없습니다.</p>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              {list.map((item) => (
                <article
                  key={item.publicUserActivityLogId}
                  className="rounded-2xl border border-[#f1f5f9] bg-white p-[25px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex gap-6">
                    <div className="flex w-[160px] shrink-0 flex-col gap-3 self-start">
                      <div className="relative aspect-3/2 w-full overflow-hidden rounded-lg bg-[#f1f5f9]">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="160px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      {item.contentMissing ? (
                        <span className="flex h-9 w-full items-center justify-center rounded bg-[#e2e8f0] text-[12px] font-bold text-[#64748b]">
                          콘텐츠 보기
                        </span>
                      ) : (
                        <Link
                          href={contentHref(item.contentType, item.contentCode)}
                          className="flex h-9 w-full items-center justify-center rounded bg-[#e1f800] text-[12px] font-bold text-black transition hover:brightness-95"
                        >
                          콘텐츠 보기
                        </Link>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] leading-5 text-[#64748b]">
                        {contentTypeLabel(item.contentType)}
                      </p>
                      {item.category ? (
                        <p className="mt-1 text-[14px] leading-5 text-[#64748b]">{item.category}</p>
                      ) : null}
                      <h3 className="mt-2 text-[18px] font-bold leading-7 text-[#0f172a]">
                        {item.title || item.contentCode}
                      </h3>
                      {(item.subtitle ?? '').trim() ? (
                        <p className="mt-2 line-clamp-2 text-[14px] leading-5 text-[#64748b]">
                          {(item.subtitle ?? '').trim()}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[#0f172a]" aria-label={`${item.ratingValue ?? 0}점`}>
                          {stars(item.ratingValue ?? 0)}
                        </span>
                        <span className="text-[12px] leading-4 text-[#94a3b8]">
                          {formatDate(item.regDateTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <WwwPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

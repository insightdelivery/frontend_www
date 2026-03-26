'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
import { fetchPublicVideoList } from '@/services/video'
import type { PublicVideoListItem } from '@/types/video'
import { getApiBaseURL } from '@/lib/axios'
import type { SysCodeItem } from '@/lib/syscode'
import {
  getSysCode,
  getSysCodeName,
  SEMINAR_CATEGORY_PARENT,
  VIDEO_CATEGORY_PARENT,
} from '@/lib/syscode'

const PAGE_SIZE = 12

const SORT_OPTIONS: { label: string; api: 'latest' | 'popular' | 'rating' }[] = [
  { label: '최신', api: 'latest' },
  { label: '인기', api: 'popular' },
  { label: '평점', api: 'rating' },
]

function resolveThumbnailUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const u = url.trim()
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return u
  if (u.startsWith('/')) {
    const base = getApiBaseURL().replace(/\/$/, '')
    return `${base}${u}`
  }
  return u
}

function formatDurationSec(sec: number | undefined | null): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return ''
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-sky-200 via-sky-400 to-sky-700',
  'bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-700',
  'bg-gradient-to-br from-violet-200 via-violet-400 to-violet-700',
]

function pillClass(active: boolean) {
  return [
    'rounded-full px-4 py-2 text-[13px] font-bold transition-colors',
    active ? 'bg-black text-white' : 'border border-gray-200 bg-white text-black hover:bg-gray-50',
  ].join(' ')
}

export interface PublicVideoSeminarListPageProps {
  /** `GET /api/events/?eventTypeCode=` — list.md / seminar list.md §5.1 */
  heroEventTypeCode: string
  listContentType: 'video' | 'seminar'
  /** `/video/detail` 또는 `/seminar/detail` (쿼리 없음) */
  detailPathPrefix: string
  pageTitle: string
  pageSubtitle: string
  emptyListMessage: string
}

export default function PublicVideoSeminarListPage({
  heroEventTypeCode,
  listContentType,
  detailPathPrefix,
  pageTitle,
  pageSubtitle,
  emptyListMessage,
}: PublicVideoSeminarListPageProps) {
  const [items, setItems] = useState<PublicVideoListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sortApi, setSortApi] = useState<'latest' | 'popular' | 'rating'>('latest')
  const [sortOpen, setSortOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [seenCategories, setSeenCategories] = useState<string[]>([])
  const [categoryCodes, setCategoryCodes] = useState<SysCodeItem[]>([])

  const categoryParent = useMemo(
    () => (listContentType === 'seminar' ? SEMINAR_CATEGORY_PARENT : VIDEO_CATEGORY_PARENT),
    [listContentType],
  )

  useEffect(() => {
    void getSysCode(categoryParent).then(setCategoryCodes)
  }, [categoryParent])

  const categoryLabel = useCallback(
    (sid: string | undefined | null) => {
      const s = sid?.trim() ?? ''
      if (!s) return ''
      return getSysCodeName(categoryCodes, s)
    },
    [categoryCodes],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPublicVideoList({
        page,
        pageSize: PAGE_SIZE,
        sort: sortApi,
        contentType: listContentType,
        ...(activeCategory ? { category: activeCategory } : {}),
      })
      const list = res.videos ?? []
      setItems(list)
      setTotal(res.total ?? 0)
      setSeenCategories((prev) => {
        const next = new Set(prev)
        list.forEach((v) => {
          const c = v.category?.trim()
          if (c) next.add(c)
        })
        return Array.from(next).sort()
      })
    } catch {
      setError('데이터를 불러올 수 없습니다')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, sortApi, activeCategory, listContentType])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const sortLabel = SORT_OPTIONS.find((o) => o.api === sortApi)?.label ?? '최신'

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const window: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) window.push(i)
    return window
  }, [totalPages, page])

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[1220px] px-4 py-6 sm:px-6 md:px-8 md:py-10">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-[28px] font-black uppercase tracking-tight text-gray-900 sm:text-[34px] md:text-[42px]">
            {pageTitle}
          </h1>
          <p className="mt-2 text-[14px] text-gray-600 sm:text-[16px]">{pageSubtitle}</p>
        </header>

        <section className="mb-8 sm:mb-10">
          <HomeHeroCarousel forcedEventTypeCode={heroEventTypeCode} />
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null)
                setPage(1)
              }}
              className={pillClass(activeCategory === null)}
            >
              전체
            </button>
            {seenCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setActiveCategory(c)
                  setPage(1)
                }}
                className={pillClass(activeCategory === c)}
              >
                {categoryLabel(c) || c}
              </button>
            ))}
          </div>
          <div className="relative flex items-center gap-2">
            <span className="text-[13px] text-gray-500">정렬:</span>
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-800 hover:bg-gray-50"
            >
              {sortLabel}
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {sortOpen ? (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.api}
                    type="button"
                    onClick={() => {
                      setSortApi(opt.api)
                      setSortOpen(false)
                      setPage(1)
                    }}
                    className="block w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-gray-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-600">{emptyListMessage}</div>
        ) : (
          <section>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {items.map((row, idx) => {
                const thumb = resolveThumbnailUrl(row.thumbnail)
                const durStr = formatDurationSec(row.videoStreamInfo?.duration ?? null)
                return (
                  <Link key={row.id} href={`${detailPathPrefix}?id=${row.id}`} className="group block">
                    <div className="relative">
                      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-[#f3f4f6] shadow-sm">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full ${PLACEHOLDER_GRADIENTS[idx % PLACEHOLDER_GRADIENTS.length]}`} />
                        )}
                      </div>
                      {row.isNewBadge ? (
                        <span className="absolute left-3 top-3 rounded-full bg-yellow-300 px-2.5 py-1 text-[10px] font-extrabold text-black">
                          NEW
                        </span>
                      ) : null}
                      {durStr ? (
                        <span className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">
                          {durStr}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] uppercase text-gray-500 sm:text-[12px]">
                      {categoryLabel(row.category) || row.category?.trim() || '—'} · {row.speaker ?? '—'}
                    </p>
                    <p className="mt-0.5 text-[15px] font-extrabold leading-snug line-clamp-2 transition-colors group-hover:text-gray-600 sm:text-[17px]">
                      {row.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12px] text-gray-600 sm:text-[13px]">{row.subtitle ?? ''}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {!loading && !error && items.length > 0 ? (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
              disabled={page === 1}
              aria-label="이전 페이지"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={[
                    'h-9 w-9 rounded-lg text-[14px] font-bold transition-colors',
                    page === n ? 'bg-black text-white' : 'hover:bg-gray-100',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
              {totalPages > 7 && page < totalPages - 2 ? (
                <>
                  <span className="px-1 text-gray-400">...</span>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    className="h-9 w-9 rounded-lg text-[14px] font-bold hover:bg-gray-100"
                  >
                    {totalPages}
                  </button>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
              disabled={page === totalPages}
              aria-label="다음 페이지"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </div>
    </main>
  )
}

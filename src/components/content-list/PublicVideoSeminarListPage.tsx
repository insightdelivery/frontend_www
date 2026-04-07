'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
import WwwPagination from '@/components/common/WwwPagination'
import {
  contentCardBadges,
  sharedTopIdsFromRankingList,
  CONTENT_CARD_BADGE_STYLES,
  normalizeContentCardBadges,
} from '@/components/article/articleBadges'
import { fetchArticleRankingShare } from '@/services/libraryRanking'

const PAGE_SIZE = 12

const SORT_TABS: { label: string; api: 'latest' | 'popular' }[] = [
  { label: '최신순', api: 'latest' },
  { label: '인기순', api: 'popular' },
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
  const [sortApi, setSortApi] = useState<'latest' | 'popular'>('latest')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [seenCategories, setSeenCategories] = useState<string[]>([])
  const [categoryCodes, setCategoryCodes] = useState<SysCodeItem[]>([])
  /** list.md BEST — 당일 공유 랭킹 상위 contentCode 집합 */
  const [shareTopIds, setShareTopIds] = useState<Set<string>>(() => new Set())

  const categoryParent = useMemo(
    () => (listContentType === 'seminar' ? SEMINAR_CATEGORY_PARENT : VIDEO_CATEGORY_PARENT),
    [listContentType],
  )

  useEffect(() => {
    void getSysCode(categoryParent).then(setCategoryCodes)
  }, [categoryParent])

  useEffect(() => {
    const ct = listContentType === 'video' ? ('VIDEO' as const) : ('SEMINAR' as const)
    let cancelled = false
    fetchArticleRankingShare(ct)
      .then((res) => {
        if (!cancelled) setShareTopIds(sharedTopIdsFromRankingList(res.list))
      })
      .catch(() => {
        if (!cancelled) setShareTopIds(new Set())
      })
    return () => {
      cancelled = true
    }
  }, [listContentType])

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

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 md:px-8 md:py-10">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-[28px] font-black uppercase tracking-tight text-gray-900 sm:text-[34px] md:text-[42px]">
            {pageTitle}
          </h1>
          <p className="mt-2 text-[14px] text-gray-600 sm:text-[16px]">{pageSubtitle}</p>
        </header>

        <section className="mb-8 sm:mb-10">
          <HomeHeroCarousel forcedEventTypeCode={heroEventTypeCode} variant="inner" />
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
          <div className="flex items-center gap-5 sm:gap-6" role="tablist" aria-label="정렬">
            {SORT_TABS.map((opt) => {
              const active = sortApi === opt.api
              return (
                <button
                  key={opt.api}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setSortApi(opt.api)
                    setPage(1)
                  }}
                  className={`text-[14px] font-medium transition-colors ${
                    active ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
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
                const badges = normalizeContentCardBadges(
                  contentCardBadges(row.createdAt, row.id, shareTopIds),
                )
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
                      {badges.length > 0 ? (
                        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                          {badges.map((b) => (
                            <span
                              key={b}
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                                b === 'NEW' ? 'bg-[#fde048] text-black' : CONTENT_CARD_BADGE_STYLES[b]
                              }`}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
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
          <WwwPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </div>
    </main>
  )
}

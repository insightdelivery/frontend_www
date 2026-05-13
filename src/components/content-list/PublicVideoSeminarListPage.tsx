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
  editorialCardLift,
  editorialCatBadge,
  editorialThumbHover,
} from '@/components/home/editorialClasses'

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

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-stone-500 via-stone-600 to-stone-800',
  'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-800',
  'bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-900',
]

const PAGE_SHELL_CLASS = 'mx-auto w-full max-w-[840px] max-sm:px-5 py-6 md:py-10'
const CARD_GRID_CLASS =
  'mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3'
const MOBILE_THUMB_CLASS =
  'relative h-[120px] w-[160px] shrink-0 overflow-hidden rounded-none bg-cream-2'

function pillClass(active: boolean) {
  return [
    'rounded-full px-4 py-2 text-[13px] font-bold transition-colors',
    active ? 'bg-black text-white' : 'border border-gray-200 bg-white text-black hover:bg-gray-50',
  ].join(' ')
}

function PublicVideoSeminarCard({
  row,
  index,
  detailPathPrefix,
  categoryName,
}: {
  row: PublicVideoListItem
  index: number
  detailPathPrefix: string
  categoryName: string
}) {
  const thumb = resolveThumbnailUrl(row.thumbnail)
  const gradient = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
  const subtitle = row.subtitle?.trim() ?? ''
  const catName = categoryName || row.category?.trim() || '—'
  const href = `${detailPathPrefix}?id=${row.id}`

  return (
    <>
      <Link href={href} className={`group flex gap-3 text-left sm:hidden ${editorialCardLift}`}>
        <div className={MOBILE_THUMB_CLASS}>
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className={`h-full w-full object-cover ${editorialThumbHover}`} />
          ) : (
            <div className={`h-full w-full ${gradient} ${editorialThumbHover}`} />
          )}
          <span className={editorialCatBadge}>{catName}</span>
        </div>
        <div className="min-w-0 flex-1 self-start pt-0.5">
          <h3 className="m-0 line-clamp-2 text-[20px] font-bold leading-snug tracking-tight text-ink-900">
            {row.title}
          </h3>
          {subtitle ? (
            <p className="mt-1.5 line-clamp-2 text-[18px] font-normal leading-relaxed text-ink-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </Link>

      <Link href={href} className={`group hidden sm:block ${editorialCardLift}`}>
        <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-none bg-cream-2">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className={`h-full w-full object-cover ${editorialThumbHover}`} />
          ) : (
            <div className={`h-full w-full ${gradient} ${editorialThumbHover}`} />
          )}
          <span className={editorialCatBadge}>{catName}</span>
        </div>
        <h3 className="m-0 line-clamp-2 text-[20px] font-extrabold leading-[1.35] tracking-[-0.02em] text-ink-900">
          {row.title}
        </h3>
        {subtitle ? (
          <p className="mt-2 line-clamp-2 text-[16px] leading-[1.55] text-ink-500">
            {subtitle}
          </p>
        ) : null}
      </Link>
    </>
  )
}

function CardSkeletonGrid() {
  return (
    <>
      <div className="mt-10 flex flex-col gap-5 sm:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-3">
            <div className="h-[120px] w-[160px] shrink-0 rounded-none bg-ink-100" />
            <div className="min-w-0 flex-1 space-y-2 py-0.5">
              <div className="h-[18px] w-[75%] rounded-none bg-ink-100" />
              <div className="h-[15px] w-full rounded-none bg-ink-100" />
              <div className="h-[15px] w-[83%] rounded-none bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 hidden grid-cols-1 gap-x-6 gap-y-10 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="mb-3 aspect-[4/3] w-full bg-cream-2" />
            <div className="h-6 w-[88%] rounded-[3px] bg-ink-100" />
            <div className="mt-2 h-4 w-full rounded-[3px] bg-ink-100" />
          </div>
        ))}
      </div>
    </>
  )
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

  return (
    <main className="bg-white text-black">
      <div className={PAGE_SHELL_CLASS}>
        <header className="mb-8 sm:mb-10">
          <h1 className="text-[40px] font-bold leading-tight tracking-tight text-black">{pageTitle}</h1>
          {pageSubtitle ? (
            <p className="mt-2 text-[14px] text-gray-600 sm:text-[16px]">{pageSubtitle}</p>
          ) : null}
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
          <CardSkeletonGrid />
        ) : error ? (
          <div className="py-16 text-center text-sm text-gray-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-600">{emptyListMessage}</div>
        ) : (
          <section>
            <div className={CARD_GRID_CLASS}>
              {items.map((row, idx) => {
                return (
                  <PublicVideoSeminarCard
                    key={row.id}
                    row={row}
                    index={idx}
                    detailPathPrefix={detailPathPrefix}
                    categoryName={categoryLabel(row.category)}
                  />
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

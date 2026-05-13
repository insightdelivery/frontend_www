'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchArticleList } from '@/services/article'
import type { ArticleListItem } from '@/types/article'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { getSysCode, getSysCodeName, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'
import {
  editorialCardLift,
  editorialCatBadge,
  editorialSectionHeadBorder,
  editorialThumbHover,
} from '@/components/home/editorialClasses'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-stone-500 via-stone-600 to-stone-800',
  'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-800',
  'bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-900',
]

/** 모바일 리스트 썸네일 — 160×120, 4:3, 직각 */
const MOBILE_THUMB_CLASS =
  'relative h-[120px] w-[160px] shrink-0 overflow-hidden rounded-none bg-cream-2'

export default function HomeLatestArticles() {
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [categories, setCategories] = useState<SysCodeItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, cats] = await Promise.all([
        fetchArticleList({ page: 1, pageSize: 3, sort: 'latest' }),
        getSysCode(ARTICLE_CATEGORY_PARENT),
      ])
      setItems((res.articles ?? []).slice(0, 3))
      setCategories(cats ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="pt-10 pb-20 max-sm:py-16">
      <div className={`flex flex-row items-start justify-between gap-4 ${editorialSectionHeadBorder}`}>
        <h2 className="m-0 min-w-0 flex-1 text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-ink-900">
          최신 아티클
        </h2>
        <Link
          href="/article"
          className="group inline-flex shrink-0 items-center gap-1.5 self-start text-[14px] font-normal text-ink-500 transition-colors hover:text-ink-900"
        >
          더보기
          <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      {loading ? (
        <>
          <div className="mt-10 flex flex-col gap-5 sm:hidden">
            {[0, 1, 2].map((i) => (
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
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-3 aspect-[4/3] w-full bg-cream-2" />
                <div className="h-6 w-[88%] rounded-[3px] bg-ink-100" />
                <div className="mt-2 h-4 w-full rounded-[3px] bg-ink-100" />
              </div>
            ))}
          </div>
        </>
      ) : items.length === 0 ? (
        <p className="mt-10 text-[16px] text-ink-500">등록된 아티클이 없습니다.</p>
      ) : (
        <>
          <div className="mt-10 flex flex-col gap-5 sm:hidden">
            {items.map((a, i) => {
              const thumbSrc = resolveArticleThumbnailUrl(a.thumbnail)
              const sub = (a.subtitle || '').trim()
              const catName = getSysCodeName(categories, a.category) || '—'
              return (
                <Link
                  key={`m-${a.id}`}
                  href={`/article/detail?id=${a.id}`}
                  className={`group flex gap-3 text-left ${editorialCardLift}`}
                >
                  <div className={MOBILE_THUMB_CLASS}>
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbSrc} alt="" className={`h-full w-full object-cover ${editorialThumbHover}`} />
                    ) : (
                      <div
                        className={`h-full w-full ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]} ${editorialThumbHover}`}
                      />
                    )}
                    <span className={editorialCatBadge}>{catName}</span>
                  </div>
                  <div className="min-w-0 flex-1 self-start pt-0.5">
                    <h3 className="m-0 line-clamp-2 text-[20px] font-bold leading-snug tracking-tight text-ink-900">
                      {a.title}
                    </h3>
                    {sub ? (
                      <p className="mt-1.5 line-clamp-2 text-[18px] font-normal leading-relaxed text-ink-500">{sub}</p>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-12 hidden grid-cols-1 gap-x-6 gap-y-10 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a, i) => {
              const thumbSrc = resolveArticleThumbnailUrl(a.thumbnail)
              const sub = (a.subtitle || '').trim()
              const catName = getSysCodeName(categories, a.category) || '—'
              return (
                <Link
                  key={`d-${a.id}`}
                  href={`/article/detail?id=${a.id}`}
                  className={`group block ${editorialCardLift}`}
                >
                  <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-none bg-cream-2">
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbSrc} alt="" className={`h-full w-full object-cover ${editorialThumbHover}`} />
                    ) : (
                      <div
                        className={`h-full w-full ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]} ${editorialThumbHover}`}
                      />
                    )}
                    <span className={editorialCatBadge}>{catName}</span>
                  </div>
                  <h3 className="m-0 text-[20px] font-extrabold leading-[1.35] tracking-[-0.02em] text-ink-900">
                    {a.title}
                  </h3>
                  {sub ? <p className="mt-2 text-[16px] leading-[1.55] text-ink-500">{sub}</p> : null}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

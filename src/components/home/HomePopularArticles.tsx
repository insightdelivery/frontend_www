'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ArticleListItem } from '@/types/article'
import Link from 'next/link'
import { fetchArticleList } from '@/services/article'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { articleDetailPath } from '@/lib/contentDetailRoutes'
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
  'bg-gradient-to-br from-sky-700 via-sky-800 to-neutral-950',
  'bg-gradient-to-br from-rose-700 via-rose-800 to-neutral-950',
  'bg-gradient-to-br from-amber-700 via-amber-800 to-neutral-950',
  'bg-gradient-to-br from-violet-700 via-violet-800 to-neutral-950',
  'bg-gradient-to-br from-emerald-700 via-emerald-800 to-neutral-950',
]

const MORE_HREF = '/article/category?category=all&sort=popular'

export default function HomePopularArticles() {
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [categories, setCategories] = useState<SysCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<ArticleListItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, cats] = await Promise.all([
        fetchArticleList({ page: 1, pageSize: 4, sort: 'popular' }),
        getSysCode(ARTICLE_CATEGORY_PARENT),
      ])
      setItems((res.articles ?? []).slice(0, 4))
      setCategories(cats ?? [])
    } catch {
      setItems([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPreview(null)
  }, [items])

  const featured = items[0]
  const listItems = items.slice(0, 4)
  const displayArticle = preview ?? featured

  return (
    <section className="pt-0 pb-0 max-sm:pt-10 max-sm:pb-16">
      <div className={`flex flex-row items-end justify-between gap-4 ${editorialSectionHeadBorder}`}>
        <div className="min-w-0 flex-1">
          <span className="mb-3 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
            THIS WEEK
          </span>
          <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-ink-900">인기 아티클</h2>
        </div>
        <Link
          href={MORE_HREF}
          className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] text-ink-500 transition-colors hover:text-ink-900"
        >
          랭킹 전체
          <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 grid animate-pulse grid-cols-1 gap-12 md:grid-cols-[1.2fr_1fr]">
          <div className="aspect-[4/3] bg-cream-2" />
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 border-b border-ink-100 pb-4" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-10 text-[16px] text-ink-500">인기 아티클이 없습니다.</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[1.2fr_1fr] md:items-start">
          {displayArticle ? (
            <Link
              href={articleDetailPath(displayArticle.id)}
              className={`group block min-w-0 ${editorialCardLift}`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-2">
                {resolveArticleThumbnailUrl(displayArticle.thumbnail) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={displayArticle.id}
                    src={resolveArticleThumbnailUrl(displayArticle.thumbnail)!}
                    alt=""
                    className={`h-full w-full object-cover ${editorialThumbHover}`}
                  />
                ) : (
                  <div
                    key={`ph-${displayArticle.id}`}
                    className={`h-full w-full ${
                      PLACEHOLDER_GRADIENTS[Math.abs(displayArticle.id) % PLACEHOLDER_GRADIENTS.length]
                    } ${editorialThumbHover}`}
                  />
                )}
                <span className={editorialCatBadge}>
                  {getSysCodeName(categories, displayArticle.category) || '—'}
                </span>
              </div>
            </Link>
          ) : null}

          <div
            className="flex min-w-0 flex-col gap-1"
            onMouseLeave={() => setPreview(null)}
          >
            {listItems.map((a, idx) => {
              const rank = String(idx + 1).padStart(2, '0')
              const catName = getSysCodeName(categories, a.category) || '—'
              const sub = (a.subtitle || '').trim()
              return (
                <Link
                  key={a.id}
                  href={articleDetailPath(a.id)}
                  onMouseEnter={() => setPreview(a)}
                  className="group/row -mx-2 grid grid-cols-[44px_1fr] gap-3 rounded-sm border-b border-ink-100 px-2 py-3 transition-[background-color,box-shadow,color] last:border-b-0 hover:bg-paper hover:shadow-[inset_3px_0_0_0_#D9F032]"
                >
                  <span className="font-mono text-[24px] font-extrabold leading-none tracking-[-0.04em] text-ink-900 transition-colors group-hover/row:text-accent-lime-deep">
                    {rank}
                  </span>
                  <div className="min-w-0">
                    <h4 className="m-0 mb-1 min-w-0 truncate text-[20px] font-bold leading-[1.35] tracking-[-0.02em] text-ink-900 transition-colors group-hover/row:text-ink-900">
                      {a.title}
                    </h4>
                    <p className="m-0 flex min-w-0 items-baseline gap-2 text-[16px] leading-[1.5] text-ink-500 transition-colors group-hover/row:text-ink-700">
                      <span className="shrink-0 translate-y-[-1px] rounded-[3px] bg-ink-100 px-2 py-0.5 text-[12px] font-semibold text-ink-700 transition-colors group-hover/row:bg-ink-200 group-hover/row:text-ink-900">
                        {catName}
                      </span>
                      <span className="min-w-0 truncate">{sub || '\u00a0'}</span>
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

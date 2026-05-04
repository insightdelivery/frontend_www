'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { fetchArticleList } from '@/services/article'
import type { ArticleListItem } from '@/types/article'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { CONTENT_CARD_HOVER_ZOOM_CLASS } from '@/components/article/articleBadges'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700',
  'bg-gradient-to-br from-sky-200 via-sky-400 to-sky-700',
  'bg-gradient-to-br from-rose-200 via-rose-400 to-rose-700',
  'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700',
  'bg-gradient-to-br from-violet-200 via-violet-400 to-violet-800',
  'bg-gradient-to-br from-emerald-200 via-emerald-500 to-emerald-800',
]

const MORE_HREF = '/article/category?category=all&sort=popular'

export default function HomePopularArticles() {
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchArticleList({ page: 1, pageSize: 6, sort: 'popular' })
      setItems((res.articles ?? []).slice(0, 6))
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
    <section className="mt-10 flex flex-col gap-[22px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-bold leading-[32px] text-black">인기 아티클</h2>
        <Link href={MORE_HREF} className="text-[14px] font-medium text-[#6b7280] hover:text-black">
          더보기 &gt;
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-[92px] w-[128px] shrink-0 animate-pulse rounded-lg bg-gray-200 sm:h-[100px] sm:w-[140px]" />
              <div className="min-w-0 flex-1 space-y-2 py-1">
                <div className="h-4 w-[80%] animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#6b7280]">인기 아티클이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
          {items.map((a, i) => {
            const thumbSrc = resolveArticleThumbnailUrl(a.thumbnail)
            return (
              <Link
                key={a.id}
                href={`/article/detail?id=${a.id}`}
                className="group flex gap-4 text-left"
              >
                <div className="relative h-[92px] w-[128px] shrink-0 overflow-hidden rounded-lg bg-[#f3f4f6] sm:h-[100px] sm:w-[140px]">
                  {thumbSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt=""
                      className={`h-full w-full object-cover ${CONTENT_CARD_HOVER_ZOOM_CLASS}`}
                    />
                  ) : (
                    <div
                      className={`h-full w-full ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]} ${CONTENT_CARD_HOVER_ZOOM_CLASS}`}
                    />
                  )}
                  <span
                    className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-neutral-700 shadow-sm ring-1 ring-black/5"
                    aria-hidden
                  >
                    <Bookmark className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </div>
                <div className="min-w-0 flex-1 self-start pt-0.5">
                  <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-[#202020] group-hover:underline">
                    {a.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-normal leading-relaxed text-gray-700">
                    {(a.subtitle || '').trim() || '\u00a0'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchArticleList } from '@/services/article'
import type { ArticleListItem } from '@/types/article'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { getSysCode, getSysCodeName, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700',
  'bg-gradient-to-br from-sky-200 via-sky-300 to-sky-600',
  'bg-gradient-to-br from-rose-200 via-rose-300 to-rose-600',
]

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
    <section className="mt-10 flex flex-col gap-[22px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-black text-[24px] leading-[32px]">최신 아티클</h2>
        </div>
        <Link href="/article" className="font-medium text-[#6b7280] text-[14px] hover:text-black">
          더보기 &gt;
        </Link>
      </div>

      {loading ? (
        <>
          <div className="flex flex-col gap-4 sm:hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-[76px] w-[104px] shrink-0 animate-pulse rounded-lg bg-gray-200" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <div className="h-4 w-[75%] animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-[83%] animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden grid-cols-2 gap-6 sm:grid lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-[8px] border border-[#e5e7eb] bg-gray-100 aspect-[3/2] min-h-[180px]"
              />
            ))}
          </div>
        </>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#6b7280]">등록된 아티클이 없습니다.</p>
      ) : (
        <>
          <div className="flex flex-col gap-5 sm:hidden">
            {items.map((a, i) => {
              const thumbSrc = resolveArticleThumbnailUrl(a.thumbnail)
              const catName = getSysCodeName(categories, a.category) || '—'
              const sub = (a.subtitle || '').trim()
              return (
                <Link key={a.id} href={`/article/detail?id=${a.id}`} className="group flex gap-3 text-left">
                  <div className="relative h-[76px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-[#f3f4f6]">
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]}`} />
                    )}
                    <span className="absolute left-2 top-2 max-w-[calc(100%-0.5rem)] truncate rounded-md bg-[#FF9F8A] px-1.5 py-0.5 text-[9px] font-bold text-black">
                      {catName}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 self-start pt-0.5">
                    <p className="line-clamp-2 text-[15px] font-bold leading-snug text-[#202020] group-hover:underline">
                      {a.title}
                    </p>
                    {sub ? (
                      <p className="mt-1 line-clamp-2 text-[13px] font-normal leading-relaxed text-[#4b5563]">
                        {sub}
                      </p>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="hidden grid-cols-2 gap-6 sm:grid lg:grid-cols-3">
            {items.map((a, i) => {
              const thumbSrc = resolveArticleThumbnailUrl(a.thumbnail)
              return (
                <Link key={a.id} href={`/article/detail?id=${a.id}`}>
                  <div className="group">
                    <div className="relative overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                      {thumbSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbSrc}
                          alt=""
                          className="aspect-[3/2] w-full object-cover"
                        />
                      ) : (
                        <div className={`aspect-[3/2] ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]}`} />
                      )}
                      <span className="absolute left-3 top-3 rounded-[8px] bg-[#FF9F8A] px-2 py-1 font-bold text-black text-[10px]">
                        {getSysCodeName(categories, a.category)}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[16px] font-medium leading-6 text-[#202020] group-hover:underline">
                      {a.title}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

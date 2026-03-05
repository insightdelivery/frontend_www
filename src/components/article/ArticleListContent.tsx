'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArticleCard } from './ArticleCard'
import { EditorPickCard } from './EditorPickCard'
import { fetchArticleList } from '@/services/article'
import type { ArticleListItem } from '@/types/article'
import { getSysCode, getSysCodeName, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'

/** 썸네일 없을 때 사용할 그라데이션 (인덱스로 순환) */
const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-700',
  'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-500',
  'bg-gradient-to-br from-rose-200 via-rose-300 to-rose-600',
  'bg-gradient-to-br from-sky-200 via-sky-300 to-sky-600',
  'bg-gradient-to-br from-stone-300 via-stone-400 to-stone-600',
  'bg-gradient-to-br from-violet-200 via-violet-400 to-violet-700',
  'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-700',
  'bg-gradient-to-br from-teal-200 via-teal-400 to-teal-700',
  'bg-gradient-to-br from-amber-200 to-amber-600',
  'bg-gradient-to-br from-green-300 to-green-700',
  'bg-gradient-to-br from-pink-200 to-pink-600',
]

function getGradient(index: number) {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
}

/** 최신 14일 이내면 NEW (주요 섹션용). 공유 섹션은 카드에서 직접 tag="BEST" 사용 */
function getTag(item: ArticleListItem): 'NEW' | 'BEST' | undefined {
  const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0
  const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation <= 14) return 'NEW'
  return undefined
}

export function ArticleListContent() {
  const [categories, setCategories] = useState<SysCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allArticles, setAllArticles] = useState<ArticleListItem[]>([])

  // §5 list.me: localStorage sysCodeData SYS26209B002 → pill에 sysCodeName 표시, 링크에 sysCodeSid
  useEffect(() => {
    getSysCode(ARTICLE_CATEGORY_PARENT).then((list) => setCategories(list ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchArticleList({ page: 1, pageSize: 50, sort: 'latest' })
      setAllArticles(res.articles ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // § list-api.me: 섹션별 분배
  const mainArticles = allArticles.slice(0, 6)
  const hotArticles = [...allArticles]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 3)
  const sharedArticles = [...allArticles]
    .sort((a, b) => (b.highlightCount ?? 0) - (a.highlightCount ?? 0))
    .slice(0, 3)
  const editorArticles = allArticles.filter((a) => Boolean(a.isEditorPick)).slice(0, 3)

  if (loading) {
    return (
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900 mb-8 sm:mb-10">
          아티클
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-gray-100 animate-pulse aspect-[3/2] min-h-[200px]"
            />
          ))}
        </div>
        <p className="mt-6 text-gray-500 text-sm">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900 mb-8 sm:mb-10">
          아티클
        </h1>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-700"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
      <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900 mb-8 sm:mb-10">
        아티클
      </h1>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {mainArticles.map((article, i) => (
            <ArticleCard
              key={article.id}
              id={String(article.id)}
              title={article.title}
              categoryName={getSysCodeName(categories, article.category)}
              editorName={article.author}
              tag={getTag(article)}
              thumbnail={article.thumbnail}
              imageGradient={getGradient(i)}
            />
          ))}
        </div>
        {mainArticles.length === 0 && (
          <p className="text-gray-500 text-sm">등록된 아티클이 없습니다.</p>
        )}
      </section>

      <section className="mt-10 sm:mt-14">
        <h2 className="text-[18px] sm:text-[20px] font-black text-gray-800 mb-4">
          아티클 카테고리
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.sysCodeSid}
              href={`/article/category?category=${encodeURIComponent(cat.sysCodeSid)}`}
              className="inline-flex px-4 py-2.5 rounded-full text-[13px] sm:text-[14px] font-bold text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {cat.sysCodeName}
            </Link>
          ))}
        </div>
      </section>

      {hotArticles.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-extrabold text-gray-900">
              지금 가장 핫한 아티클
            </h2>
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {hotArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                id={String(article.id)}
                title={article.title}
                categoryName={getSysCodeName(categories, article.category)}
                editorName={article.author}
                thumbnail={article.thumbnail}
                imageGradient={getGradient(6 + i)}
              />
            ))}
          </div>
        </section>
      )}

      {sharedArticles.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-extrabold text-gray-900">
              가장 많이 공유된 아티클
            </h2>
            <span className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" aria-hidden />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {sharedArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                id={String(article.id)}
                title={article.title}
                categoryName={getSysCodeName(categories, article.category)}
                editorName={article.author}
                tag="BEST"
                thumbnail={article.thumbnail}
                imageGradient={getGradient(9 + i)}
              />
            ))}
          </div>
        </section>
      )}

      {editorArticles.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-extrabold text-gray-900">
              에디터 추천
            </h2>
            <span className="text-red-500 text-lg leading-none" aria-hidden>
              ★
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {editorArticles.map((article, i) => (
              <EditorPickCard
                key={article.id}
                id={String(article.id)}
                title={article.title}
                subText={article.author}
                thumbnail={article.thumbnail}
                imageGradient={getGradient(12 + i)}
                imageShape={i % 2 === 0 ? 'circle' : 'square'}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ArticleCard } from './ArticleCard'
import { ArticleCategoryPills } from './ArticleCategoryPills'
import { articleCardBadges } from './articleBadges'
import { EditorPickCard } from './EditorPickCard'
import {
  fetchArticleList,
  resolveArticlesByRanking,
} from '@/services/article'
import { fetchArticleRankingHot, fetchArticleRankingShare } from '@/services/libraryRanking'
import type { ArticleListItem } from '@/types/article'
import { getSysCode, getSysCodeName, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'

/** 썸네일 없을 때 사용할 그라데이션 (인덱스로 순환) */
const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-stone-500 via-stone-600 to-stone-800',
  'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-800',
  'bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-900',
]

const ARTICLE_PAGE_SHELL_CLASS = 'mx-auto w-full max-w-[840px] max-sm:px-5 py-6 md:py-10'
const ARTICLE_CARD_GRID_CLASS =
  'mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3'

function getGradient(index: number) {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
}

export function ArticleListContent() {
  const [categories, setCategories] = useState<SysCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allArticles, setAllArticles] = useState<ArticleListItem[]>([])
  const [hotArticles, setHotArticles] = useState<ArticleListItem[]>([])
  const [sharedArticles, setSharedArticles] = useState<ArticleListItem[]>([])

  // §5 list.me: localStorage sysCodeData SYS26209B002 → pill에 sysCodeName 표시, 링크에 sysCodeSid
  useEffect(() => {
    getSysCode(ARTICLE_CATEGORY_PARENT).then((list) => setCategories(list ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, hotRes, shareRes] = await Promise.all([
        fetchArticleList({ page: 1, pageSize: 50, sort: 'latest' }),
        fetchArticleRankingHot().catch(() => ({ list: [] as { contentCode: string; rankOrder: number }[] })),
        fetchArticleRankingShare().catch(() => ({ list: [] as { contentCode: string; rankOrder: number }[] })),
      ])
      const articles = listRes.articles ?? []
      setAllArticles(articles)
      const byId = new Map(articles.map((a) => [String(a.id), a]))
      const hot = await resolveArticlesByRanking(hotRes.list ?? [], byId)
      const shared = await resolveArticlesByRanking(shareRes.list ?? [], byId)
      setHotArticles(hot)
      setSharedArticles(shared)
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // § list.md: 주요 6 / 핫·공유는 랭킹 API / 에디터 추천
  const mainArticles = allArticles.slice(0, 6)
  const editorArticles = allArticles.filter((a) => Boolean(a.isEditorPick)).slice(0, 3)
  const sharedTopIds = useMemo(
    () => new Set(sharedArticles.map((a) => String(a.id))),
    [sharedArticles]
  )

  if (loading) {
    return (
      <div className={ARTICLE_PAGE_SHELL_CLASS}>
        <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900 mb-8 sm:mb-10">
          아티클
        </h1>
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
        <p className="mt-6 text-gray-500 text-sm">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={ARTICLE_PAGE_SHELL_CLASS}>
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
    <div className={ARTICLE_PAGE_SHELL_CLASS}>
      <div className="mb-8 sm:mb-10 flex items-center justify-between gap-3">
        <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900">
          아티클
        </h1>
        <Link
          href="/article/category?category=all"
          className="shrink-0 text-[14px] sm:text-[15px] font-bold text-gray-700 hover:text-black underline underline-offset-4"
        >
          전체보기
        </Link>
      </div>

      <section>
        <div className={ARTICLE_CARD_GRID_CLASS}>
          {mainArticles.map((article, i) => (
            <ArticleCard
              key={article.id}
              id={String(article.id)}
              title={article.title}
              subtitle={article.subtitle}
              categoryName={getSysCodeName(categories, article.category)}
              badges={articleCardBadges(article, sharedTopIds)}
              thumbnail={article.thumbnail}
              imageGradient={getGradient(i)}
            />
          ))}
        </div>
        {mainArticles.length === 0 && (
          <p className="text-gray-500 text-sm">등록된 아티클이 없습니다.</p>
        )}
      </section>

      <ArticleCategoryPills />

      {hotArticles.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-extrabold text-gray-900">
              지금 가장 핫한 아티클
            </h2>
          </div>
          <div className={ARTICLE_CARD_GRID_CLASS}>
            {hotArticles.map((article, i) => (
              <ArticleCard
                key={`hot-${article.id}`}
                id={String(article.id)}
                title={article.title}
                subtitle={article.subtitle}
                categoryName={getSysCodeName(categories, article.category)}
                badges={articleCardBadges(article, sharedTopIds)}
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
          </div>
          <div className={ARTICLE_CARD_GRID_CLASS}>
            {sharedArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                id={String(article.id)}
                title={article.title}
                subtitle={article.subtitle}
                categoryName={getSysCodeName(categories, article.category)}
                badges={articleCardBadges(article, sharedTopIds)}
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
              에디터 추천 아티클
            </h2>
          </div>
          <div className={ARTICLE_CARD_GRID_CLASS}>
            {editorArticles.map((article, i) => (
              <ArticleCard
                key={`editor-${article.id}`}
                id={String(article.id)}
                title={article.title}
                subtitle={article.subtitle}
                categoryName={getSysCodeName(categories, article.category)}
                badges={articleCardBadges(article, sharedTopIds)}
                thumbnail={article.thumbnail}
                imageGradient={getGradient(12 + i)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

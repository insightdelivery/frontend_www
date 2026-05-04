'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSysCode, getSysCodeName, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'
import { fetchArticleList, fetchPublicContentAuthorProfile } from '@/services/article'
import { fetchArticleRankingShare } from '@/services/libraryRanking'
import type { ArticleListItem } from '@/types/article'
import { ArticleCard } from '@/components/article/ArticleCard'
import { articleCardBadges, sharedTopIdsFromRankingList } from '@/components/article/articleBadges'
import WwwPagination from '@/components/common/WwwPagination'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-amber-100 to-amber-600',
  'bg-gradient-to-br from-emerald-200 to-emerald-600',
  'bg-gradient-to-br from-sky-200 to-sky-600',
  'bg-gradient-to-br from-violet-200 to-violet-600',
  'bg-gradient-to-br from-stone-300 to-stone-600',
  'bg-gradient-to-br from-rose-200 to-rose-600',
]

function getGradient(index: number) {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
}

function parseAuthorId(raw: string | null): number | null {
  if (raw == null || raw === '') return null
  const n = parseInt(raw, 10)
  if (Number.isNaN(n) || n <= 0) return null
  return n
}

function ArticleEditorContent() {
  const searchParams = useSearchParams()
  const authorId = parseAuthorId(searchParams.get('author_id'))

  const [categories, setCategories] = useState<SysCodeItem[]>([])
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articlesError, setArticlesError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sharedTopIds, setSharedTopIds] = useState<Set<string>>(() => new Set())
  const [profileIntro, setProfileIntro] = useState<string | null>(null)
  const pageSize = 12

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const idValid = authorId != null

  useEffect(() => {
    let cancelled = false
    getSysCode(ARTICLE_CATEGORY_PARENT).then((list) => {
      if (!cancelled) setCategories(list ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchArticleRankingShare()
      .then((res) => {
        if (!cancelled) setSharedTopIds(sharedTopIdsFromRankingList(res.list))
      })
      .catch(() => {
        if (!cancelled) setSharedTopIds(new Set())
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadArticles = useCallback(() => {
    if (authorId == null) return
    setArticlesLoading(true)
    setArticlesError(null)
    fetchArticleList({
      page: currentPage,
      pageSize,
      authorId,
      sort: 'latest',
    })
      .then((res) => {
        setArticles(res.articles ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((e) => {
        setArticlesError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
      })
      .finally(() => setArticlesLoading(false))
  }, [currentPage, authorId])

  useEffect(() => {
    if (!idValid) return
    loadArticles()
  }, [idValid, loadArticles])

  useEffect(() => {
    setCurrentPage(1)
  }, [authorId])

  useEffect(() => {
    if (!idValid || authorId == null) return
    let cancelled = false
    if (articlesLoading) return
    if (articles.length > 0) {
      setProfileIntro(null)
      return
    }
    void fetchPublicContentAuthorProfile(authorId)
      .then((p) => {
        if (cancelled) return
        const t = (p.authorEditorIntro ?? '').trim()
        setProfileIntro(t || null)
      })
      .catch(() => {
        if (!cancelled) setProfileIntro(null)
      })
    return () => {
      cancelled = true
    }
  }, [idValid, authorId, articlesLoading, articles.length])

  const metaArticle = articles.length > 0 ? articles[0] : null
  const headingName =
    metaArticle?.author?.trim()
      ? metaArticle.author.trim()
      : authorId != null
        ? `작성자 ID ${authorId}`
        : '에디터'
  const headingAffiliation = metaArticle?.authorAffiliation?.trim() || ''
  const headingAvatarSrc =
    (metaArticle?.authorProfileImage && metaArticle.authorProfileImage.trim()) || '/editorDefault.png'
  const editorIntro = (metaArticle?.authorEditorIntro ?? '').trim()
  const introText = editorIntro || (profileIntro ?? '').trim()

  if (!idValid) {
    return (
      <main className="bg-white text-black">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-10">
          <p className="text-gray-800 mb-4">잘못된 접근입니다. 에디터 정보가 없습니다.</p>
          <Link href="/article" className="text-sm text-blue-600 underline hover:no-underline">
            아티클 목록으로
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <div className="mb-6">
          <p className="text-[12px] sm:text-[13px] text-gray-500 mb-3">에디터 글 모아보기</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {articlesLoading && articles.length === 0 ? (
                <>
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gray-200 animate-pulse flex-shrink-0 ring-1 ring-slate-200/90" />
                  <div className="h-9 w-48 max-w-[70vw] bg-gray-200 rounded-lg animate-pulse" />
                </>
              ) : (
                <>
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-slate-200/90 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={headingAvatarSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      width={64}
                      height={64}
                    />
                  </div>
                  <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900 leading-tight">
                      {headingName}
                    </h1>
                    {headingAffiliation ? (
                      <span className="text-[16px] sm:text-[18px] md:text-[20px] font-semibold text-gray-500">
                        {headingAffiliation}
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
          {introText ? (
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[14px] sm:text-[15px] leading-relaxed text-gray-700">
              {introText}
            </p>
          ) : null}
          <div className="mt-5 border-b border-[#e2e8f0]" aria-hidden />
        </div>

        {articlesError && <p className="text-red-600 mb-4">{articlesError}</p>}

        {articlesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-gray-100 animate-pulse aspect-[3/2] min-h-[180px]"
              />
            ))}
          </div>
        ) : (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {articles.map((article, idx) => (
                <ArticleCard
                  key={article.id}
                  id={String(article.id)}
                  title={article.title}
                  subtitle={article.subtitle}
                  categoryName={getSysCodeName(categories, article.category)}
                  badges={articleCardBadges(article, sharedTopIds)}
                  thumbnail={article.thumbnail}
                  imageGradient={getGradient(idx)}
                />
              ))}
            </div>
            {articles.length === 0 && (
              <p className="text-gray-500 text-sm">등록된 아티클이 없습니다.</p>
            )}
          </section>
        )}

        {!articlesLoading && (
          <WwwPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>
    </main>
  )
}

function EditorPageFallback() {
  return (
    <main className="bg-white text-black min-h-[60vh] flex items-center justify-center">
      <p className="text-gray-500">로딩 중...</p>
    </main>
  )
}

export default function ArticleEditorPage() {
  return (
    <Suspense fallback={<EditorPageFallback />}>
      <ArticleEditorContent />
    </Suspense>
  )
}

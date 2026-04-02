'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { getSysCode, getSysCodeName, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'
import { fetchArticleList } from '@/services/article'
import { fetchArticleRankingShare } from '@/services/libraryRanking'
import type { ArticleListItem } from '@/types/article'
import { ArticleCard } from '@/components/article/ArticleCard'
import { articleCardBadges, sharedTopIdsFromRankingList } from '@/components/article/articleBadges'
import WwwPagination from '@/components/common/WwwPagination'

const SORT_OPTIONS = [
  { value: 'latest' as const, label: '최신순' },
  { value: 'popular' as const, label: '인기순' },
]

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

function ArticleCategoryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawCategorySid = searchParams.get('category') ?? ''
  const isAllSelected = rawCategorySid.toLowerCase() === 'all'
  const categorySid = isAllSelected ? '' : rawCategorySid

  const [categories, setCategories] = useState<SysCodeItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [articlesError, setArticlesError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sharedTopIds, setSharedTopIds] = useState<Set<string>>(() => new Set())
  const pageSize = 12
  const dropdownRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // §5 list.me: localStorage sysCodeData 중 SYS26209B002 로드 → sysCodeName 표시, 클릭 시 sysCodeSid 전달
  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    getSysCode(ARTICLE_CATEGORY_PARENT).then((list) => {
      if (!cancelled) {
        setCategories(list ?? [])
        setCategoriesLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  // list.md — 메인 `/article`과 동일: 당일 공유 랭킹 상위 3 → BEST (경량: list만 조회)
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
    setArticlesLoading(true)
    setArticlesError(null)
    fetchArticleList({
      page: currentPage,
      pageSize,
      category: categorySid || undefined,
      sort: sortBy,
    })
      .then((res) => {
        setArticles(res.articles ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((e) => {
        setArticlesError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
      })
      .finally(() => setArticlesLoading(false))
  }, [currentPage, categorySid, sortBy])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const categoryName = isAllSelected ? '전체' : (categorySid ? getSysCodeName(categories, categorySid) : '아티클')

  const handleSelectCategory = (sid: string) => {
    setCategoryDropdownOpen(false)
    setCurrentPage(1)
    if (sid === 'all') {
      router.push('/article/category?category=all')
      return
    }
    router.push(`/article/category?category=${encodeURIComponent(sid)}`)
  }

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <div className="mb-6">
          <p className="text-[12px] sm:text-[13px] text-gray-500 mb-1">아티클 카테고리</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900">
                {categoriesLoading ? '...' : categoryName}
              </h1>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCategoryDropdownOpen(!categoryDropdownOpen)
                  }}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  카테고리 선택
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('all')}
                      className={`block w-full px-4 py-2.5 text-left text-[13px] hover:bg-gray-50 ${isAllSelected ? 'font-bold text-black bg-neon-yellow/20' : 'text-gray-700'}`}
                    >
                      전체
                    </button>
                    {categories.map((item) => (
                      <button
                        key={item.sysCodeSid}
                        type="button"
                        onClick={() => handleSelectCategory(item.sysCodeSid)}
                        className={`block w-full px-4 py-2.5 text-left text-[13px] hover:bg-gray-50 ${item.sysCodeSid === categorySid ? 'font-bold text-black bg-neon-yellow/20' : 'text-gray-700'}`}
                      >
                        {item.sysCodeName}
                      </button>
                    ))}
                    {categories.length === 0 && !categoriesLoading && (
                      <p className="px-4 py-2 text-gray-400 text-[13px]">카테고리 없음</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-500">정렬 기준:</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`text-[13px] font-medium transition-colors ${sortBy === opt.value ? 'text-black font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {articlesError && (
          <p className="text-red-600 mb-4">{articlesError}</p>
        )}

        {articlesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-gray-100 animate-pulse aspect-[3/2] min-h-[180px]" />
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

function CategoryPageFallback() {
  return (
    <main className="bg-white text-black min-h-[60vh] flex items-center justify-center">
      <p className="text-gray-500">로딩 중...</p>
    </main>
  )
}

export default function ArticleCategoryPage() {
  return (
    <Suspense fallback={<CategoryPageFallback />}>
      <ArticleCategoryContent />
    </Suspense>
  )
}

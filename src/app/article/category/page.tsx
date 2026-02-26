'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Footer from '@/components/layout/Footer'

const CATEGORIES = [
  '스터디',
  '브랜딩',
  '공간',
  '크루',
  '취미/일상',
  '서적',
  '글로벌',
  '콘텐츠',
  '5일의 도시',
  '업무와 생산성',
]

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
]

const MOCK_ARTICLES = [
  { title: '디지털 공간에서의 현대 타이포그래피 가이드', category: '도서', author: 'Sarah Kim', imageGradient: 'bg-gradient-to-br from-amber-100 to-amber-600' },
  { title: '2024년 독서 습관 뒤에 숨겨진 심리학 이해하기', category: '도서', author: 'Mike Ross', imageGradient: 'bg-gradient-to-br from-emerald-200 to-emerald-600' },
  { title: '종이책 서점이 놀랍게 부활하고 있는 이유', category: '도서', author: '김에디터', imageGradient: 'bg-gradient-to-br from-sky-200 to-sky-600' },
  { title: '모든 크리에이티브 디렉터가 소장해야 할 디자인 서적 Top 10', category: '디자인', author: 'Lee Soo', imageGradient: 'bg-gradient-to-br from-violet-200 to-violet-600' },
  { title: '과거를 보존하다: 고서 복원의 예술', category: '역사', author: 'Park Min', imageGradient: 'bg-gradient-to-br from-stone-300 to-stone-600' },
  { title: '독립 출판사가 문학계 풍경을 바꾸는 방법', category: '트렌드', author: 'Choi Yun', imageGradient: 'bg-gradient-to-br from-rose-200 to-rose-600' },
  { title: "'침묵의 봄' 리메이크 저자에게 듣는 이야기", category: '인문학', author: '정현수', imageGradient: 'bg-gradient-to-br from-teal-200 to-teal-600' },
  { title: '디지털 시대에 읽는다는 것의 낭만', category: '디자인', author: '한지민', imageGradient: 'bg-gradient-to-br from-amber-200 to-amber-500' },
  { title: '전자책 대 종이책: 논쟁은 드디어 끝났나?', category: '도서', author: 'Kim Alex', imageGradient: 'bg-gradient-to-br from-slate-300 to-slate-600' },
  { title: '2024년 예비 개발자를 위한 필수 도서 목록', category: '교육', author: '이개발', imageGradient: 'bg-gradient-to-br from-green-200 to-green-600' },
  { title: '현대 북 커버 레이아웃에 미친 바우하우스의 영향', category: '디자인', author: 'Design Co', imageGradient: 'bg-gradient-to-br from-orange-200 to-orange-600' },
  { title: '작은 아파트에서 완벽한 독서 공간 꾸미기', category: '라이프스타일', author: 'Interior Lee', imageGradient: 'bg-gradient-to-br from-pink-200 to-pink-500' },
]

function CategoryCard({
  title,
  categoryTag,
  author,
  imageGradient,
}: {
  title: string
  categoryTag: string
  author: string
  imageGradient: string
}) {
  return (
    <Link href="#" className="block group">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className={`aspect-[4/3] ${imageGradient}`} />
      </div>
      <p className="mt-2 text-[11px] sm:text-[12px] text-gray-500">{categoryTag}</p>
      <p className="mt-0.5 text-[15px] sm:text-[17px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
        {title}
      </p>
      <p className="mt-1 text-[11px] sm:text-[12px] text-gray-500">BY: {author}</p>
    </Link>
  )
}

function ArticleCategoryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryName = searchParams.get('category') || '아티클'
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 5

  const handleSelectCategory = (cat: string) => {
    setCategoryDropdownOpen(false)
    router.push(`/article/category?category=${encodeURIComponent(cat)}`)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <div className="mb-6">
          <p className="text-[12px] sm:text-[13px] text-gray-500 mb-1">아티클 카테고리</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900">
                {categoryName}
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
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className={`block w-full px-4 py-2.5 text-left text-[13px] hover:bg-gray-50 ${cat === categoryName ? 'font-bold text-black bg-neon-yellow/20' : 'text-gray-700'}`}
                      >
                        {cat}
                      </button>
                    ))}
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
                  onClick={() => setSortBy(opt.value as 'latest' | 'popular')}
                  className={`text-[13px] font-medium transition-colors ${sortBy === opt.value ? 'text-black font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {MOCK_ARTICLES.map((article, idx) => (
              <CategoryCard
                key={idx}
                title={article.title}
                categoryTag={article.category}
                author={article.author}
                imageGradient={article.imageGradient}
              />
            ))}
          </div>
        </section>

        <div className="mt-10 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
            disabled={currentPage === 1}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCurrentPage(n)}
              className={`h-9 min-w-[36px] rounded-lg text-[14px] font-bold transition-colors ${currentPage === n ? 'bg-neon-yellow text-black' : 'hover:bg-gray-100'}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
            disabled={currentPage === totalPages}
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Footer />
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'

// Figma: 브랜딩, 공간, 크루, 취미/일상, 서적, 글로벌, 콘텐츠, 5일의 도시, 업무와 생산성. 활성=스터디
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

function ArticleCard({
  title,
  categoryName = '카테고리명',
  editorName = '에디터 이름',
  tag,
  imageGradient,
}: {
  title: string
  categoryName?: string
  editorName?: string
  tag?: 'NEW' | 'BEST'
  imageGradient: string
}) {
  return (
    <Link href="#" className="block group">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className={`aspect-[4/3] sm:aspect-[3/2] ${imageGradient}`} />
        {tag && (
          <span
            className={[
              'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-black',
              tag === 'NEW' ? 'bg-neon-yellow' : 'bg-brand-orange text-white',
            ].join(' ')}
          >
            {tag}
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] sm:text-[12px] text-gray-500">{categoryName}</p>
      <p className="mt-0.5 text-[15px] sm:text-[17px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
        {title}
      </p>
      <p className="mt-1 text-[11px] sm:text-[12px] text-gray-500">{editorName}</p>
    </Link>
  )
}

// Figma: 에디터 추천 - 가로 3개 카드 한 줄, 카드마다 이미지 왼쪽(원형 또는 정사각형), 오른쪽 제목·하단 소개
function EditorPickCard({
  title,
  subText = '에디터 이름',
  imageGradient,
  imageShape = 'circle',
}: {
  title: string
  subText?: string
  imageGradient: string
  imageShape?: 'circle' | 'square'
}) {
  return (
    <Link
      href="#"
      className="flex gap-3 sm:gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm group hover:border-gray-300 hover:bg-gray-50 transition-colors min-w-0"
    >
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 overflow-hidden ${imageGradient} ${imageShape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
      />
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="text-[14px] sm:text-[15px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
          {title}
        </p>
        <p className="mt-1 text-[11px] sm:text-[12px] text-gray-500">{subText}</p>
      </div>
    </Link>
  )
}

export default function ArticlePage() {
  const [activeCategory, setActiveCategory] = useState('스터디')

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* Figma: 페이지 상단 큰 제목 "아티클" */}
        <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900 mb-8 sm:mb-10">
          아티클
        </h1>

        {/* Figma: 주요 아티클 그리드 - 6개 (2행 x 3열), 이미지 → 카테고리명 → 제목 → 에디터 이름 */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <ArticleCard
              title="사용자를 혁신하는 디자인 시스템 구축 가이드 [2 컬러로 표현 가능]"
              tag="NEW"
              imageGradient="bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-700"
            />
            <ArticleCard
              title="2024년 트렌드: 지속 가능한 브랜딩 전략"
              tag="NEW"
              imageGradient="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-500"
            />
            <ArticleCard
              title="여성 리더십과 조직문화의 변화"
              tag="NEW"
              imageGradient="bg-gradient-to-br from-rose-200 via-rose-300 to-rose-600"
            />
            <ArticleCard
              title="스타트업 초기 팀빌딩의 중요성"
              imageGradient="bg-gradient-to-br from-sky-200 via-sky-300 to-sky-600"
            />
            <ArticleCard
              title="영감을 주는 이달의 도서 추천 6선"
              imageGradient="bg-gradient-to-br from-stone-300 via-stone-400 to-stone-600"
            />
            <ArticleCard
              title="효과적인 프레젠테이션 스킬 마스터하기"
              imageGradient="bg-gradient-to-br from-violet-200 via-violet-400 to-violet-700"
            />
          </div>
        </section>

        {/* Figma: 아티클 카테고리 - 선택 시 /article/category/[slug] 페이지로 이동 (Figma 1-470) */}
        <section className="mt-10 sm:mt-14">
          <h2 className="text-[18px] sm:text-[20px] font-black text-gray-800 mb-4">
            아티클 카테고리
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/article/category?category=${encodeURIComponent(cat)}`}
                className={[
                  'inline-flex px-4 py-2.5 rounded-full text-[13px] sm:text-[14px] font-bold transition-colors',
                  activeCategory === cat
                    ? 'bg-neon-yellow text-black'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>

        {/* Figma: 지금 가장 핫한 아티클 - 제목 뒤 빨간 점 */}
        <section className="mt-10 sm:mt-14">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-extrabold text-gray-900">
              지금 가장 핫한 아티클
            </h2>
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <ArticleCard
              title="성공적인 프로젝트 관리를 위한 5가지 원칙"
              imageGradient="bg-gradient-to-br from-sky-200 via-sky-300 to-sky-600"
            />
            <ArticleCard
              title="디지털 시대의 아날로그 감성 마케팅"
              imageGradient="bg-gradient-to-br from-stone-300 via-stone-400 to-stone-600"
            />
            <ArticleCard
              title="2024년 상반기 테크 업계 현황과 분석"
              imageGradient="bg-gradient-to-br from-violet-200 via-violet-400 to-violet-800"
            />
          </div>
        </section>

        {/* Figma: 가장 많이 공유된 아티클 - 제목 뒤 주황 점, BEST 태그 */}
        <section className="mt-10 sm:mt-14">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-extrabold text-gray-900">
              가장 많이 공유된 아티클
            </h2>
            <span className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" aria-hidden />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <ArticleCard
              title="조직 문화를 바꾸는 작은 습관들"
              tag="BEST"
              imageGradient="bg-gradient-to-br from-slate-300 via-slate-400 to-slate-700"
            />
            <ArticleCard
              title="독서가 뇌에 미치는 긍정적인 영향"
              tag="BEST"
              imageGradient="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-600"
            />
            <ArticleCard
              title="리모트 워크 시대의 소통 방식"
              tag="BEST"
              imageGradient="bg-gradient-to-br from-teal-200 via-teal-400 to-teal-700"
            />
          </div>
        </section>

        {/* Figma: 에디터 추천 - 가로 3개 카드 한 줄, 넓고 낮은 카드, 제목 옆 빨간 별 */}
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
            <EditorPickCard
              title="성공을 배우는 비밀 속 영감 찾기"
              imageGradient="bg-gradient-to-br from-amber-200 to-amber-600"
              imageShape="circle"
            />
            <EditorPickCard
              title="팬데믹이 우리에게 던지는 질문들"
              imageGradient="bg-gradient-to-br from-green-300 to-green-700"
              imageShape="square"
            />
            <EditorPickCard
              title="MZ세대와 함께 일하는 방법"
              imageGradient="bg-gradient-to-br from-pink-200 to-pink-600"
              imageShape="circle"
            />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}

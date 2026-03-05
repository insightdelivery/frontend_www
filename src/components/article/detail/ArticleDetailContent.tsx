'use client'

import Link from 'next/link'
import { ChevronRight, Bookmark, Share2, Star } from 'lucide-react'

const CONTENT_MAX = 'max-w-[1220px] mx-auto'
const COLORS = {
  text: 'text-[#0f172a]',
  textSecondary: 'text-[#64748b]',
  border: 'border-[#e2e8f0]',
  bgLight: 'bg-[#f8fafc]',
  accent: 'bg-[#e1f800]',
  quoteBorder: 'border-l-[#e1f800]',
} as const

export const MOCK_DETAIL: Record<string, {
  title: string
  category: string
  tags: string[]
  editorName: string
  editorDate: string
  imageGradient: string
  lead: string
  quote: string
  quoteBy: string
  body: string
}> = {
  '1': {
    title: '"책 안 팔 방법 고민" 소수책방이 일·사람·성장을 만드는 법',
    category: '서적',
    tags: ['#1인간관계', '#독서', '#전문가되기', '#사회생활'],
    editorName: '홍길동 에디터',
    editorDate: '2025.03.05',
    imageGradient: 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-500',
    lead: '우리는 모두 성장을 갈망합니다. 하지만 그 성장이 반드시 숫자로만 증명되어야 할까요? 그들은 단순히 책을 많이 파는 것에 집중하지 않습니다. 오히려 \'어떻게 하면 책을 덜 팔고 더 깊게 읽게 할까\'를 고민합니다.',
    quote: '"자영업은 내 삶의 주인이자 노예가 되는 일이다. 그러나 그 안에서 발견하는 사람들의 온기가 나를 매일 성장시킨다."',
    quoteBy: '소수책방 인터뷰 중',
    body: '성장은 결과가 아니라 과정에 있다는 말이 진부하게 들릴지 모릅니다. 하지만 소수책방에서 만난 사람들은 그 진부한 진리를 몸소 실천하고 있었습니다. 일과 삶, 그리고 사람이 섞이는 지점에서 그들은 자신만의 속도로 나아가고 있습니다.',
  },
  default: {
    title: '아티클 제목',
    category: '스터디',
    tags: ['#태그1', '#태그2'],
    editorName: '에디터 이름',
    editorDate: '2025.01.01',
    imageGradient: 'bg-gradient-to-br from-slate-200 to-slate-500',
    lead: '도입 문단입니다.',
    quote: '"인용문입니다."',
    quoteBy: '출처',
    body: '본문 내용입니다.',
  },
}

const RELATED = [
  { id: '1', title: '독립 서점에서 발견한 나만의 취향', editor: '이성민 에디터', imageGradient: 'bg-gradient-to-br from-emerald-200 to-emerald-600' },
  { id: '2', title: '성장을 위한 기록의 기술', editor: '박지수 에디터', imageGradient: 'bg-gradient-to-br from-sky-200 to-sky-600' },
  { id: '3', title: '함께 읽고 토론하는 커뮤니티의 힘', editor: '김현아 에디터', imageGradient: 'bg-gradient-to-br from-violet-200 to-violet-600' },
]

function detailUrl(id: string) {
  return `/article/detail?id=${encodeURIComponent(id)}`
}

export interface ArticleDetailContentProps {
  id: string
}

function ArticleDetailContent({ id }: ArticleDetailContentProps) {
  const data = MOCK_DETAIL[id] ?? MOCK_DETAIL.default

  return (
    <div className={`${CONTENT_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20`}>
      <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
        <Link href="/article" className={`text-[14px] leading-5 ${COLORS.textSecondary} hover:underline`}>
          아티클
        </Link>
        <ChevronRight className="h-5 w-4 text-[#64748b] flex-shrink-0" aria-hidden />
        <span className={`text-[14px] leading-5 font-semibold ${COLORS.text}`}>{data.category}</span>
      </nav>

      <header className="mb-8">
        <h1 className={`font-extrabold text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1] tracking-[-0.025em] ${COLORS.text} mb-4`}>
          {data.title}
        </h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="bg-[#e2e8f0] text-[12px] font-medium text-[#0f172a] px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className={`flex items-center justify-between py-[25px] border-t border-b ${COLORS.border}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#cbd5e1] overflow-hidden flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold text-[16px] leading-6 ${COLORS.text}`}>{data.editorName}</span>
                <button type="button" className={`text-[12px] ${COLORS.textSecondary} underline hover:no-underline`}>
                  에디터의 글 더보기
                </button>
              </div>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-0.5`}>{data.editorDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="p-1.5 rounded hover:bg-gray-100" aria-label="북마크">
              <Bookmark className="h-5 w-5 text-[#0f172a]" />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-gray-100" aria-label="공유">
              <Share2 className="h-5 w-5 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </header>

      <div className={`aspect-[4/3] rounded-[12px] overflow-hidden ${data.imageGradient} mb-10`} />

      <div className={`text-[18px] sm:text-[20px] leading-[1.625] ${COLORS.text} mb-8`}>
        {data.lead.split('\n').map((p, i) => (
          <p key={i} className="mb-4 last:mb-0">{p}</p>
        ))}
      </div>

      <blockquote className={`border-l-4 ${COLORS.quoteBorder} pl-9 pt-6 pb-2 mb-8`}>
        <p className={`font-bold text-[24px] sm:text-[30px] leading-[1.2] ${COLORS.text} mb-8`}>
          {data.quote}
        </p>
        <footer className={`border-t ${COLORS.border} pt-16 pb-8 px-6 text-[16px] ${COLORS.text}`}>
          — {data.quoteBy}
        </footer>
      </blockquote>

      <div className={`text-[18px] leading-[1.625] ${COLORS.text} py-4`}>
        {data.body}
      </div>

      <section className="my-10 p-6 rounded-xl bg-blue-50/50 border-2 border-blue-200">
        <p className="font-bold text-[12px] text-[#0f172a] mb-1">© InDe Content Policy</p>
        <p className="text-[12px] leading-[19.5px] text-[#475569]">
          본 콘텐츠는 인디가 제작한 고유한 자산으로 무단 전재 및 재배포, AI 학습·활용을 금합니다. 원문의 20% 이상 인용할 수 없으며, 일부 인용한 경우 반드시 출처를 표기해야 합니다.
        </p>
      </section>

      <section className={`${COLORS.accent} rounded-2xl p-8 flex flex-wrap items-center justify-between gap-4 mb-12`}>
        <div>
          <h3 className="font-black text-[24px] leading-8 text-black mb-1">인사이트 확장하기!</h3>
          <p className="text-[16px] text-black/70">24시간 공유 링크로 인사이트와 복음을 나눠보세요!</p>
        </div>
        <button type="button" className="bg-black text-white text-[16px] font-bold px-8 py-3 rounded-xl hover:opacity-90">
          링크 복사하기
        </button>
      </section>

      <section className={`${COLORS.bgLight} border ${COLORS.border} rounded-2xl p-8 mb-12`}>
        <h3 className={`font-bold text-[20px] ${COLORS.text} mb-6`}>적용 질문</h3>
        <div className="space-y-6">
          <div>
            <label className={`block font-semibold text-[14px] leading-5 ${COLORS.text} mb-2`}>
              Q1. 나는 어떻게 살아야 할까요?
            </label>
            <textarea
              placeholder="나만의 생각을 정리해보세요."
              className="w-full min-h-[120px] p-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] text-gray-500 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className={`block font-semibold text-[14px] leading-5 ${COLORS.text} mb-2`}>
              Q2. 우리는 어떻게 살아야 할까요?
            </label>
            <textarea
              placeholder="우리라는 관점에서 고민을 적어주세요."
              className="w-full min-h-[120px] p-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] text-gray-500 placeholder:text-gray-400"
            />
          </div>
          <button type="button" className="w-full bg-black text-white text-[16px] font-bold py-4 rounded-xl">
            저장하기
          </button>
        </div>
        <div className="border-t border-[#e2e8f0] pt-10 mt-8 text-center">
          <p className={`font-bold text-[16px] ${COLORS.text} mb-3`}>콘텐츠가 도움이 되었나요?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="p-1 hover:opacity-70" aria-label={`${n}점`}>
                <Star className="h-6 w-6 text-[#e2e8f0] hover:text-amber-400" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-16 mb-12">
        <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>관련 아티클</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED.map((item) => (
            <Link key={item.id} href={detailUrl(item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.editor}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-16 mb-12">
        <div className="flex items-center gap-2 mb-8">
          <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>추천 아티클</h2>
          <span className="bg-[#e1f800] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
            Editor&apos;s Pick
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED.map((item) => (
            <Link key={item.id} href={detailUrl(item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl border border-slate-100 overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.editor}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-16">
        <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>주간 인기 콘텐츠</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED.map((item) => (
            <Link key={item.id} href={detailUrl(item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.editor}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ArticleDetailContent

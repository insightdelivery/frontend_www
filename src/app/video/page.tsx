'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import Footer from '@/components/layout/Footer'

const FILTERS = ['All', 'Marketing', 'Design', 'Tech']
const SORT_OPTIONS = ['Latest', 'Popular', 'Longest']

const VIDEO_ITEMS = [
  {
    title: 'User Interface Trends for 2025: Minimalist Approaches',
    category: 'DESIGN',
    presenter: 'SeHn J Hibbins',
    duration: '17:00',
    description: 'Explore the shift towards cleaner, more focused interface design.',
    tag: 'NEW' as const,
    imageGradient: 'bg-gradient-to-br from-sky-200 via-sky-400 to-sky-700',
  },
  {
    title: 'Startup Scaling: From Series A to IPO',
    category: 'BUSINESS',
    presenter: 'David Ch',
    duration: '49:18',
    description: 'Key milestones and strategies for growing your startup.',
    tag: undefined,
    imageGradient: 'bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-700',
  },
  {
    title: 'Leadership in Remote-First Teams',
    category: 'LEADERSHIP',
    presenter: 'Alex Kim',
    duration: '28:05',
    description: 'Building trust and alignment across distributed teams.',
    tag: 'NEW' as const,
    imageGradient: 'bg-gradient-to-br from-violet-200 via-violet-400 to-violet-700',
  },
  {
    title: 'Design Systems That Scale',
    category: 'DESIGN',
    presenter: 'Jane Lee',
    duration: '32:41',
    description: 'Creating and maintaining design systems for large products.',
    imageGradient: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600',
  },
  {
    title: 'Consumer Behavior in 2024',
    category: 'MARKETING',
    presenter: 'Mike Park',
    duration: '41:20',
    description: 'How emerging technologies are changing consumer behaviors.',
    imageGradient: 'bg-gradient-to-br from-rose-200 via-rose-400 to-rose-600',
  },
  {
    title: 'Tech Stack Decisions for Startups',
    category: 'TECH',
    presenter: 'Sarah Yoon',
    duration: '25:33',
    description: 'Choosing the right technologies without over-engineering.',
    imageGradient: 'bg-gradient-to-br from-teal-200 via-teal-400 to-teal-700',
  },
]

export default function VideoPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Latest')
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage] = useState(1)

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* Header: Title + Subtitle */}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-black text-gray-900 uppercase tracking-tight">
            비디오
          </h1>
          <p className="mt-2 text-[14px] sm:text-[16px] text-gray-600">
            큐레이션된 비디오 콘텐츠를 통해 최신 트렌드와 인사이트를 만나보세요.
          </p>
        </header>

        {/* Hero: Featured */}
        <section className="mb-8 sm:mb-10">
          <div className="relative overflow-hidden rounded-2xl bg-teal-800 min-h-[280px] sm:min-h-[320px] flex flex-col justify-end p-6 sm:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
            <div className="absolute inset-0 opacity-10 text-teal-300 text-4xl sm:text-6xl font-bold pointer-events-none flex items-center justify-center">
              Featured
            </div>
            <span className="relative inline-flex w-fit items-center rounded-full bg-neon-yellow px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-black">
              FEATURED
            </span>
            <p className="relative mt-2 text-[12px] sm:text-[13px] text-white/90">Business Strategy</p>
            <h2 className="relative mt-1 text-[18px] sm:text-[22px] md:text-[26px] font-bold leading-tight text-white max-w-2xl">
              2024 글로벌 마케팅 트렌드: 새로운 디지털 환경을 탐색하다
            </h2>
            <p className="relative mt-2 text-[12px] sm:text-[14px] text-white/90 max-w-xl line-clamp-2">
              떠오르는 기술과 소비자 행동이 마케팅의 미래를 어떻게 만들어가는지, 업계 리더들과 깊이 있는 대담을 나눕니다.
            </p>
            <button
              type="button"
              className="relative mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-[13px] font-bold text-white hover:bg-gray-800 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" />
              지금 보기
            </button>
          </div>
        </section>

        {/* Filter + Sort bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={[
                  'rounded-full px-4 py-2 text-[13px] font-bold transition-colors',
                  activeFilter === f
                    ? 'bg-black text-white'
                    : 'border border-gray-200 bg-white text-black hover:bg-gray-50',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex items-center gap-2">
            <span className="text-[13px] text-gray-500">Sort by:</span>
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-800 hover:bg-gray-50"
            >
              {sortBy}
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSortBy(opt)
                      setSortOpen(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {VIDEO_ITEMS.map((item, idx) => (
              <Link key={idx} href="#" className="block group">
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className={`aspect-video ${item.imageGradient}`} />
                  {item.tag && (
                    <span className="absolute left-3 top-3 rounded-full bg-neon-yellow px-2.5 py-1 text-[10px] font-extrabold text-black">
                      {item.tag}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                    {item.duration}
                  </span>
                </div>
                <p className="mt-2 text-[11px] sm:text-[12px] text-gray-500 uppercase">
                  {item.category} · {item.presenter}
                </p>
                <p className="mt-0.5 text-[15px] sm:text-[17px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] sm:text-[13px] text-gray-600 line-clamp-2">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
            disabled={page === 1}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={[
                  'h-9 w-9 rounded-lg text-[14px] font-bold transition-colors',
                  page === n ? 'bg-black text-white' : 'hover:bg-gray-100',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
            <span className="px-1 text-gray-400">...</span>
            <button
              type="button"
              onClick={() => setPage(8)}
              className="h-9 w-9 rounded-lg text-[14px] font-bold hover:bg-gray-100"
            >
              8
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(8, p + 1))}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
            disabled={page === 8}
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

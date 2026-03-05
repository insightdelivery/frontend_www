'use client'

import Link from 'next/link'
import { ChevronRight, Play, Bookmark, Share2, Download } from 'lucide-react'

const CONTAINER = 'max-w-[1220px] mx-auto'
const COLORS = {
  text: 'text-[#0f172a]',
  textSecondary: 'text-[#64748b]',
  body: 'text-[#334155]',
  border: 'border-[#e2e8f0]',
  bgLight: 'bg-[#f8fafc]',
  tagBg: 'bg-[#f1f5f9]',
  accent: 'bg-[#e1f800]',
} as const

export type ContentDetailType = 'video' | 'seminar'

export interface VideoSeminarDetailData {
  title: string
  category: string
  presenter: string
  duration: string
  date?: string
  description: string
  keyContents?: string[]
  imageGradient: string
  tag?: 'NEW' | 'FEATURED'
  progress?: number
  currentTime?: string
  totalTime?: string
}

const MOCK_VIDEO: Record<string, VideoSeminarDetailData> = {
  '1': {
    title: 'Deep Dive: Future of Digital Experience & AI Interaction',
    category: 'Digital Experience',
    presenter: 'Jane Doe',
    duration: '45:00',
    date: '2023.10.24',
    description: '본 세미나에서는 디지털 인터페이스 디자인의 근본적인 변화에 대해 다룹니다. 특히 사용자 중심의 모달리티와 AI 기반 인터랙션의 통합이 가져올 미래 UX 환경을 심도 있게 분석합니다. 지난 10년간의 GUI 발전을 넘어, 이제는 사용자의 의도를 예측하고 반응하는 지능형 시스템으로의 진화가 필수적입니다.',
    keyContents: [
      '생성형 AI가 디자인 워크플로우에 미치는 영향',
      '멀티모달 인터랙션의 실제 사례 분석',
      '데이터 기반 디자인 의사결정 프로세스',
    ],
    imageGradient: 'bg-gradient-to-br from-sky-200 via-sky-400 to-sky-700',
    progress: 33,
    currentTime: '12:45',
    totalTime: '45:00',
  },
  default: {
    title: '비디오 제목',
    category: 'CATEGORY',
    presenter: '발표자',
    duration: '00:00',
    description: '설명입니다.',
    imageGradient: 'bg-gradient-to-br from-slate-200 to-slate-500',
    progress: 0,
    currentTime: '0:00',
    totalTime: '0:00',
  },
}

const MOCK_SEMINAR: Record<string, VideoSeminarDetailData> = {
  '1': {
    title: '2025 사용자 인터페이스 트렌드: 미니멀리즘 접근',
    category: 'DESIGN',
    presenter: '김세현',
    duration: '1:17',
    date: '2025.03.15',
    description: '더 단순하고 집중된 인터페이스 디자인으로의 전환을 탐구합니다. 실무에 적용할 수 있는 미니멀 UI 사례를 함께 살펴봅니다.',
    keyContents: [
      '미니멀 UI의 원칙과 적용',
      '실무 사례 분석',
      '디자인 시스템 연계',
    ],
    imageGradient: 'bg-gradient-to-br from-sky-200 via-sky-400 to-sky-700',
    tag: 'NEW',
  },
  default: {
    title: '세미나 제목',
    category: 'CATEGORY',
    presenter: '발표자',
    duration: '0:00',
    date: '2025.01.01',
    description: '설명입니다.',
    imageGradient: 'bg-gradient-to-br from-slate-200 to-slate-500',
  },
}

const RELATED_ITEMS: { id: string; title: string; author: string; imageGradient: string }[] = [
  { id: '2', title: '독립 서점에서 발견한 나만의 취향', author: '이성민 에디터', imageGradient: 'bg-gradient-to-br from-emerald-200 to-emerald-700' },
  { id: '3', title: '성장을 위한 기록의 기술', author: '박지수 에디터', imageGradient: 'bg-gradient-to-br from-violet-200 to-violet-700' },
  { id: '4', title: '함께 읽고 토론하는 커뮤니티의 힘', author: '김현아 에디터', imageGradient: 'bg-gradient-to-br from-amber-200 to-amber-600' },
]

function getDetailUrl(type: ContentDetailType, id: string) {
  return type === 'video' ? `/video/detail?id=${encodeURIComponent(id)}` : `/seminar/detail?id=${encodeURIComponent(id)}`
}

function getListUrl(type: ContentDetailType) {
  return type === 'video' ? '/video' : '/seminar'
}

function getListLabel(type: ContentDetailType) {
  return type === 'video' ? '비디오' : '세미나'
}

export interface VideoSeminarDetailContentProps {
  type: ContentDetailType
  id: string
}

function VideoSeminarDetailContent({ type, id }: VideoSeminarDetailContentProps) {
  const data = (type === 'video' ? MOCK_VIDEO : MOCK_SEMINAR)[id] ?? (type === 'video' ? MOCK_VIDEO.default : MOCK_SEMINAR.default)
  const listLabel = getListLabel(type)
  const listUrl = getListUrl(type)
  const currentTime = data.currentTime ?? '0:00'
  const totalTime = data.totalTime ?? data.duration
  const progress = data.progress ?? 0

  return (
    <div className={`${CONTAINER} px-4 sm:px-6 md:px-8 pt-6 pb-20`}>
      {/* Hero: Video Player — Figma 22:270 */}
      <section className="flex flex-col gap-8 mb-10">
        <div className="relative overflow-hidden rounded-[12px] bg-black w-full">
          <div className={`aspect-video w-full opacity-80 ${data.imageGradient}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              className={`${COLORS.accent} rounded-full size-[80px] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity`}
              aria-label="재생"
            >
              <Play className="h-6 w-6 text-black fill-black ml-1" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col gap-3">
            <div className="h-1 w-full rounded-full bg-white/30 overflow-hidden">
              <div
                className={`h-full ${COLORS.accent} rounded-full transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[12px] text-white leading-4">
                {currentTime} / {totalTime}
              </span>
              <div className="flex items-center gap-4">
                <button type="button" className="text-white/90 hover:text-white p-1" aria-label="볼륨" />
                <button type="button" className="text-white/90 hover:text-white p-1" aria-label="전체화면" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Breadcrumb — Figma 22:292, 14px #64748b / 14px Bold #0f172a */}
          <nav className="flex items-center gap-2" aria-label="Breadcrumb">
            <Link href={listUrl} className={`text-[14px] leading-5 ${COLORS.textSecondary} hover:underline`}>
              {listLabel}
            </Link>
            <ChevronRight className="h-5 w-4 text-[#64748b] flex-shrink-0" aria-hidden />
            <span className={`text-[14px] leading-5 font-bold ${COLORS.text}`}>{data.category}</span>
          </nav>

          {/* Header — Figma 22:299 */}
          <div className="flex flex-col gap-8">
            <h1 className={`font-bold text-[32px] sm:text-[40px] md:text-[48px] leading-[48px] tracking-[-1.2px] ${COLORS.text}`}>
              {data.title}
            </h1>
            {/* Tags — Figma 22:302, bg #f1f5f9, 12px Medium #0f172a */}
            <div className="flex flex-wrap gap-2">
              <span className={`${COLORS.tagBg} text-[12px] font-medium text-[#0f172a] px-3 py-1 rounded-full`}>
                #{data.category.replace(/\s/g, '')}
              </span>
            </div>
            {/* Author row — Figma 22:311, border top/bottom #e2e8f0, py-[25px] */}
            <div className={`flex items-center justify-between py-[25px] border-t border-b ${COLORS.border}`}>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-[#cbd5e1] flex-shrink-0" />
                <div>
                  <p className={`font-bold text-[16px] leading-6 ${COLORS.text}`}>{data.presenter}</p>
                  <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-0.5`}>{data.date ?? data.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 border ${COLORS.border} rounded-lg px-4 py-2.5 text-[14px] font-bold ${COLORS.text} hover:bg-gray-50`}
                >
                  <Download className="h-3 w-3" />
                  강의 자료 다운로드
                </button>
                <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="공유">
                  <Share2 className="h-5 w-5 text-[#0f172a]" />
                </button>
                <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="북마크">
                  <Bookmark className="h-5 w-5 text-[#0f172a]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content — Figma 22:333, 18px #334155 leading-[29.25px] */}
      <div className="flex flex-col gap-6 mb-10">
        <div className={`text-[18px] leading-[29.25px] ${COLORS.body}`}>
          {data.description}
        </div>
        {data.keyContents && data.keyContents.length > 0 && (
          <div className={`text-[18px] leading-[29.25px] ${COLORS.body}`}>
            <p className="font-medium mb-2">주요 {type === 'seminar' ? '세션' : '예정'} 내용:</p>
            <ul className="list-decimal list-inside space-y-1">
              {data.keyContents.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA Banner — Figma 21:57, 인사이트 확장하기 */}
      <section className={`${COLORS.accent} rounded-2xl p-8 flex flex-wrap items-center justify-between gap-4 mb-12`}>
        <div>
          <h3 className="font-black text-[24px] leading-8 text-black">인사이트 확장하기!</h3>
          <p className="text-[16px] text-black/70 mt-1 leading-6">
            24시간 공유 링크로 인사이트와 복음을 나눠보세요!
          </p>
        </div>
        <button
          type="button"
          className="bg-black text-white text-[16px] font-bold px-8 py-3 rounded-xl hover:opacity-90"
        >
          링크 복사하기
        </button>
      </section>

      {/* 적용 질문 — Figma 21:74 */}
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
        <div className={`border-t ${COLORS.border} pt-10 mt-8 text-center`}>
          <p className={`font-bold text-[16px] ${COLORS.text} mb-3`}>콘텐츠가 도움이 되었나요?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="p-1 hover:opacity-70" aria-label={`${n}점`}>
                <span className="text-2xl text-[#e2e8f0] hover:text-amber-400">★</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 관련 콘텐츠 — Figma 21:108, 24px Bold tracking -0.6px */}
      <section className="pt-16 mb-12">
        <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>관련 {listLabel}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED_ITEMS.map((item) => (
            <Link key={item.id} href={getDetailUrl(type, item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.author}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 추천 아티클 — Figma 21:133, Editor's Pick pill */}
      <section className="pt-16 mb-12">
        <div className="flex items-center gap-2 mb-8">
          <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>추천 아티클</h2>
          <span className="bg-[#e1f800] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
            Editor&apos;s Pick
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED_ITEMS.map((item) => (
            <Link key={item.id} href={getDetailUrl(type, item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl border border-slate-100 overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.author}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 주간 인기 콘텐츠 — Figma 22:520 */}
      <section className="pt-16">
        <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>주간 인기 콘텐츠</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED_ITEMS.map((item) => (
            <Link key={item.id} href={getDetailUrl(type, item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.author}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default VideoSeminarDetailContent

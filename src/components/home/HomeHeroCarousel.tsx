'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchHeroDisplayEvents } from '@/services/displayEvent'
import type { DisplayEventHeroItem } from '@/types/displayEvent'
import { heroInternalHref } from '@/lib/heroRoutes'
import { resolveHeroEventTypeCode } from '@/lib/heroEventType'
import { getApiBaseURL } from '@/lib/axios'

const MIN_HEIGHT = 'min-h-[320px] sm:min-h-[400px] md:min-h-[521px]'
/** 슬라이드가 멈춰 있는 시간(다음 장으로 넘어가기 전) */
const SLIDE_HOLD_MS = 5000
/** 왼쪽으로 넘어가는 트랜지션 시간 */
const SLIDE_TRANSITION_MS = 550

/** 백엔드 상대 경로(/media/…)는 브라우저가 www 오리진으로 요청하지 않도록 API 베이스를 붙임 */
function resolveHeroImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const u = url.trim()
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return u
  if (u.startsWith('/')) {
    const base = getApiBaseURL().replace(/\/$/, '')
    return `${base}${u}`
  }
  return u
}

function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href.trim())
}

function resolveSlideHref(slide: DisplayEventHeroItem) {
  if (slide.linkUrl && isExternalUrl(slide.linkUrl)) {
    return { kind: 'external' as const, url: slide.linkUrl }
  }
  if (slide.contentId != null) {
    return { kind: 'internal' as const, path: heroInternalHref(slide.contentTypeCode, slide.contentId) }
  }
  if (slide.linkUrl) {
    return { kind: 'external' as const, url: slide.linkUrl }
  }
  return null
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * 캐러셀 뷰포트 너비 — 로딩 후 트랙이 마운트된 뒤(enabled) 측정.
 */
function useContainerWidth<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    if (!enabled) {
      setWidth(0)
      return
    }
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth || el.getBoundingClientRect().width
      setWidth(Math.max(0, Math.floor(w)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [enabled])
  return { ref, width }
}

function SlideVisual({ slide }: { slide: DisplayEventHeroItem }) {
  const title = slide.title || '제목 없음'
  const subtitle = slide.subtitle || ''
  const badge = slide.badgeText?.trim() || ''
  const bg = resolveHeroImageUrl(slide.imageUrl)

  return (
    <>
      <div
        className="absolute inset-0 z-0 opacity-90 bg-cover bg-center"
        style={
          bg
            ? { backgroundImage: `url(${bg})` }
            : {
                background:
                  'linear-gradient(180deg, #374151 0%, #1f2937 50%, #111827 100%)',
              }
        }
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 z-[2] flex flex-col justify-end p-6 sm:p-8 md:p-12 pointer-events-none text-white">
        {badge ? (
          <div className="pb-4">
            <span className="inline-block rounded-full bg-[#e1f800] px-3 py-1 font-bold text-[12px] uppercase tracking-[0.3px] text-black">
              {badge}
            </span>
          </div>
        ) : null}
        <h1 className="font-black text-white text-[32px] leading-[1.1] sm:text-[40px] md:text-[48px] md:leading-[48px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-[672px] font-normal text-[18px] text-white/80 sm:text-[20px] sm:leading-[28px]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  )
}

function HeroSlideCell({
  slide,
  cellWidth,
}: {
  slide: DisplayEventHeroItem
  cellWidth: number
}) {
  const title = slide.title || '제목 없음'
  const href = resolveSlideHref(slide)
  const w = cellWidth > 0 ? cellWidth : undefined

  const shell = (
    <div className={`relative ${MIN_HEIGHT} shrink-0 overflow-hidden`} style={{ width: w ?? '100%' }}>
      <SlideVisual slide={slide} />
    </div>
  )

  if (href?.kind === 'internal') {
    return (
      <Link
        href={href.path}
        className="block shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1f800]"
        style={{ width: w }}
        aria-label={title}
      >
        {shell}
      </Link>
    )
  }
  if (href?.kind === 'external') {
    return (
      <a
        href={href.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1f800]"
        style={{ width: w }}
        aria-label={title}
      >
        {shell}
      </a>
    )
  }
  return <div className="shrink-0">{shell}</div>
}

function StaticHero() {
  return (
    <section className="mb-16 overflow-hidden rounded-[12px] bg-[#f3f4f6]">
      <div className={`relative ${MIN_HEIGHT} w-full`}>
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'linear-gradient(180deg, #374151 0%, #1f2937 50%, #111827 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12">
          <div className="pb-4">
            <span className="inline-block rounded-full bg-[#e1f800] px-3 py-1 font-bold text-[12px] uppercase tracking-[0.3px] text-black">
              Director&apos;s Pick
            </span>
          </div>
          <h1 className="font-black text-white text-[32px] leading-[1.1] sm:text-[40px] md:text-[48px] md:leading-[48px]">
            소망의 시작, 파격적이고 명료한 복음이 바꾸는 당신의 일상
          </h1>
          <p className="mt-2 max-w-[672px] font-normal text-[18px] text-white/80 sm:text-[20px] sm:leading-[28px]">
            디렉터 추천 콘텐츠 - 아티클, 비디오 등 디렉터가 엄선한 5개의 콘텐츠를 만나보세요.
          </p>
        </div>
      </div>
    </section>
  )
}

function ReducedMotionHero({ slides }: { slides: DisplayEventHeroItem[] }) {
  const slide = slides[0]
  const title = slide.title || '제목 없음'
  const href = resolveSlideHref(slide)
  const body = (
    <>
      <SlideVisual slide={slide} />
    </>
  )
  return (
    <section className="mb-16 overflow-hidden rounded-[12px] bg-[#f3f4f6]">
      <div className={`relative ${MIN_HEIGHT} w-full`}>
        {href?.kind === 'internal' ? (
          <Link href={href.path} className="absolute inset-0 block" aria-label={title}>
            {body}
          </Link>
        ) : href?.kind === 'external' ? (
          <a
            href={href.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 block"
            aria-label={title}
          >
            {body}
          </a>
        ) : (
          <div className="absolute inset-0">{body}</div>
        )}
      </div>
    </section>
  )
}

export type HomeHeroCarouselProps = {
  /** 지정 시 `resolveHeroEventTypeCode`를 쓰지 않고 이 코드로만 조회 (비디오 리스트 Hero 전용) */
  forcedEventTypeCode?: string
  /**
   * `inner`: 비디오·세미나 목록 등 — 메인과 동일한 대형 로딩 블록이면 '메인이 로딩되는 것처럼' 보이므로 컴팩트 스켈레톤
   * `home`(기본): 메인 히어로
   */
  variant?: 'home' | 'inner'
}

export default function HomeHeroCarousel({ forcedEventTypeCode, variant = 'home' }: HomeHeroCarouselProps = {}) {
  const [resolvedEventTypeCode, setResolvedEventTypeCode] = useState<string | null>(null)
  const [slides, setSlides] = useState<DisplayEventHeroItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  const carouselEnabled =
    !loading && resolvedEventTypeCode != null && slides.length > 1 && !prefersReducedMotion
  const measureEnabled =
    !loading && resolvedEventTypeCode != null && slides.length > 0 && !prefersReducedMotion

  const { ref: containerRef, width: containerW } = useContainerWidth<HTMLDivElement>(measureEnabled)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const code =
        forcedEventTypeCode != null && forcedEventTypeCode.trim() !== ''
          ? forcedEventTypeCode.trim()
          : await resolveHeroEventTypeCode()
      setResolvedEventTypeCode(code || null)
      if (!code) {
        setSlides([])
        return
      }
      try {
        const list = await fetchHeroDisplayEvents(code)
        setSlides(list)
        setActiveIndex(0)
      } catch {
        setSlides([])
      }
    } catch {
      setResolvedEventTypeCode(null)
      setSlides([])
    } finally {
      setLoading(false)
    }
  }, [forcedEventTypeCode])

  useEffect(() => {
    void load()
  }, [load])

  /** 무한 루프: [...slides, slides[0]] — 마지막에서 첫으로 “되감기” 없이 이어짐 */
  const trackSlides = slides.length > 1 ? [...slides, slides[0]!] : slides
  const cloneIndex = slides.length > 1 ? slides.length : 0

  useEffect(() => {
    if (!carouselEnabled || autoplayPaused) return
    const id = window.setInterval(() => {
      setActiveIndex((i) => {
        if (i < cloneIndex) return i + 1
        return i
      })
    }, SLIDE_HOLD_MS)
    return () => window.clearInterval(id)
  }, [carouselEnabled, autoplayPaused, cloneIndex])

  const activeIndexRef = useRef(activeIndex)
  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  /** 수동 이전·다음 후 자동 재생 카운트다운을 다시 잡기 위한 일시 정지 */
  const resumeAutoplayTimerRef = useRef<number | null>(null)
  const scheduleAutoplayResume = useCallback(() => {
    setAutoplayPaused(true)
    if (resumeAutoplayTimerRef.current != null) {
      window.clearTimeout(resumeAutoplayTimerRef.current)
    }
    resumeAutoplayTimerRef.current = window.setTimeout(() => {
      resumeAutoplayTimerRef.current = null
      setAutoplayPaused(false)
    }, SLIDE_HOLD_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (resumeAutoplayTimerRef.current != null) {
        window.clearTimeout(resumeAutoplayTimerRef.current)
      }
    }
  }, [])

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return
    scheduleAutoplayResume()
    const i = activeIndexRef.current
    if (i === cloneIndex - 1) {
      setTransitionEnabled(true)
      setActiveIndex(cloneIndex)
      return
    }
    if (i === cloneIndex) {
      setTransitionEnabled(false)
      setActiveIndex(1)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionEnabled(true))
      })
      return
    }
    setTransitionEnabled(true)
    setActiveIndex(i + 1)
  }, [slides.length, cloneIndex, scheduleAutoplayResume])

  const goToPrev = useCallback(() => {
    if (slides.length <= 1) return
    scheduleAutoplayResume()
    const i = activeIndexRef.current
    const last = slides.length - 1
    if (i === 0 || i === cloneIndex) {
      setTransitionEnabled(false)
      setActiveIndex(last)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionEnabled(true))
      })
      return
    }
    setTransitionEnabled(true)
    setActiveIndex(i - 1)
  }, [slides.length, cloneIndex, scheduleAutoplayResume])

  const handleTrackTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return
    if (slides.length <= 1) return
    if (activeIndex !== cloneIndex) return
    setTransitionEnabled(false)
    setActiveIndex(0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitionEnabled(true))
    })
  }

  if (loading) {
    if (variant === 'inner') {
      return (
        <section className="mb-8 sm:mb-10 overflow-hidden rounded-[12px] bg-[#f3f4f6]">
          <div className="relative min-h-[160px] sm:min-h-[200px] w-full flex items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300 text-gray-600 text-sm animate-pulse">
            상단 배너 불러오는 중…
          </div>
        </section>
      )
    }
    return (
      <section className="mb-16 overflow-hidden rounded-[12px] bg-[#f3f4f6]">
        <div
          className={`relative ${MIN_HEIGHT} w-full flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-900 text-white/70 text-sm`}
        >
          배너 불러오는 중…
        </div>
      </section>
    )
  }

  if (!resolvedEventTypeCode) {
    return <StaticHero />
  }

  if (slides.length === 0) {
    return (
      <section className="mb-16 overflow-hidden rounded-[12px] bg-[#f3f4f6]">
        <div className="relative min-h-[200px] flex items-center justify-center rounded-[12px] bg-gray-100 text-gray-500 text-sm">
          등록된 Hero 배너가 없습니다. (eventTypeCode: {resolvedEventTypeCode})
        </div>
      </section>
    )
  }

  if (prefersReducedMotion) {
    return <ReducedMotionHero slides={slides} />
  }

  /** 배너 1장만 있을 때는 자동 슬라이드 없음 */
  if (slides.length === 1) {
    return (
      <section className="mb-16 overflow-hidden rounded-[12px] bg-[#f3f4f6]">
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-[12px]">
          {containerW > 0 ? (
            <HeroSlideCell slide={slides[0]!} cellWidth={containerW} />
          ) : (
            <div className={`${MIN_HEIGHT} w-full bg-gradient-to-b from-gray-700 to-gray-900`} aria-hidden />
          )}
        </div>
      </section>
    )
  }

  const translatePx = containerW > 0 ? activeIndex * containerW : 0

  return (
    <section className="mb-16 rounded-[12px] bg-[#f3f4f6]">
      <div
        ref={containerRef}
        className="group relative w-full overflow-hidden rounded-[12px]"
        onMouseEnter={() => setAutoplayPaused(true)}
        onMouseLeave={() => setAutoplayPaused(false)}
      >
        {containerW > 0 ? (
          <>
            <div
              className="flex"
              style={{
                transform: `translateX(-${translatePx}px)`,
                transition: transitionEnabled
                  ? `transform ${SLIDE_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
                  : 'none',
              }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {trackSlides.map((slide, i) => (
                <HeroSlideCell key={`${slide.displayEventId}-${i}`} slide={slide} cellWidth={containerW} />
              ))}
            </div>
            <button
              type="button"
              aria-label="이전 이벤트"
              className="absolute left-2 top-1/2 z-[4] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1f800] sm:left-4 sm:h-14 sm:w-14 pointer-events-auto"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-9 w-9 sm:h-11 sm:w-11 shrink-0" strokeWidth={2.25} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="다음 이벤트"
              className="absolute right-2 top-1/2 z-[4] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1f800] sm:right-4 sm:h-14 sm:w-14 pointer-events-auto"
              onClick={goToNext}
            >
              <ChevronRight className="h-9 w-9 sm:h-11 sm:w-11 shrink-0" strokeWidth={2.25} aria-hidden />
            </button>
            <div className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 gap-2 pointer-events-auto">
              {slides.map((s, i) => (
                <button
                  key={s.displayEventId}
                  type="button"
                  aria-label={`배너 ${i + 1}로 이동`}
                  aria-current={i === activeIndex % slides.length ? 'true' : undefined}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === activeIndex % slides.length ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                  }`}
                  onClick={() => {
                    scheduleAutoplayResume()
                    setTransitionEnabled(true)
                    setActiveIndex(i)
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className={`${MIN_HEIGHT} w-full bg-gradient-to-b from-gray-700 to-gray-900`} aria-hidden />
        )}
      </div>
    </section>
  )
}

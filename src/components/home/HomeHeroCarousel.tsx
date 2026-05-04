'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchHeroDisplayEvents } from '@/services/displayEvent'
import type { DisplayEventHeroItem } from '@/types/displayEvent'
import { heroInternalHref } from '@/lib/heroRoutes'
import { resolveHeroEventTypeCode } from '@/lib/heroEventType'
import { getApiBaseURL } from '@/lib/axios'

const SLIDE_HOLD_MS = 5000
const SLIDE_TRANSITION_MS = 550

const BADGE_CLASS =
  'inline-block rounded-md bg-[#e1f800] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black md:text-xs'

/** 백엔드 상대 경로(/media/…)는 API 베이스를 붙임 */
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

type SplitSlideShellProps = {
  slide: DisplayEventHeroItem
  cellWidth?: number
}

/** Director's Pick: 좌 이미지 + 우 연회색 텍스트 패널 (wwwMainPage §2.1 / 참고 시안) */
function HeroSplitSlideShell({ slide, cellWidth }: SplitSlideShellProps) {
  const title = slide.title || '제목 없음'
  const subtitle = (slide.subtitle || '').trim()
  const badge = slide.badgeText?.trim() || ''
  const bg = resolveHeroImageUrl(slide.imageUrl)
  const href = resolveSlideHref(slide)

  const body = (
    <div
      className="flex min-h-[220px] w-full flex-col bg-[#f2f2f2] md:min-h-[280px] md:max-h-[min(70vh,520px)] md:flex-row md:items-stretch"
      style={cellWidth ? { width: cellWidth } : undefined}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-neutral-900 md:aspect-auto md:h-auto md:min-h-0 md:w-[58%]">
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            className="h-full w-full object-cover md:absolute md:inset-0 md:min-h-full"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-600 via-gray-800 to-gray-950" />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between px-5 py-5 md:w-[42%] md:px-7 md:py-7">
        <div>
          {badge ? <span className={BADGE_CLASS}>{badge}</span> : null}
          <h2 className="mt-3 text-[22px] font-bold leading-snug tracking-tight text-black md:mt-4 md:text-[28px] md:leading-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-black/80 md:mt-3 md:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (href?.kind === 'internal') {
    return (
      <Link
        href={href.path}
        className="block shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1f800]"
        style={cellWidth ? { width: cellWidth } : undefined}
        aria-label={title}
      >
        {body}
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
        style={cellWidth ? { width: cellWidth } : undefined}
        aria-label={title}
      >
        {body}
      </a>
    )
  }
  return (
    <div className="block shrink-0" style={cellWidth ? { width: cellWidth } : undefined}>
      {body}
    </div>
  )
}

function HeroDots({
  slides,
  activeIndex,
  moduloLen,
  onSelect,
}: {
  slides: DisplayEventHeroItem[]
  activeIndex: number
  moduloLen: number
  onSelect: (i: number) => void
}) {
  const cur = activeIndex % moduloLen
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-neutral-800/90 px-2.5 py-1.5 shadow-sm">
      {slides.map((s, i) => (
        <button
          key={s.displayEventId}
          type="button"
          aria-label={`배너 ${i + 1}로 이동`}
          aria-current={i === cur ? 'true' : undefined}
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            i === cur ? 'bg-white' : 'bg-white/35 hover:bg-white/60'
          }`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(i)
          }}
        />
      ))}
    </div>
  )
}

function StaticHero() {
  return (
    <section className="mb-8 overflow-hidden rounded-xl bg-[#f2f2f2] shadow-sm ring-1 ring-black/5">
      <div className="flex min-h-[220px] w-full flex-col md:min-h-[300px] md:max-h-[min(70vh,520px)] md:flex-row">
        <div className="relative aspect-video w-full shrink-0 bg-gradient-to-br from-slate-600 to-slate-900 md:aspect-auto md:h-auto md:w-[58%]">
          <div className="absolute inset-0 flex items-end justify-start p-6 md:p-10">
            <span className="font-serif text-3xl font-light tracking-wide text-white/90 md:text-4xl">inde</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between px-5 py-5 md:w-[42%] md:px-7 md:py-7">
          <div>
            <span className={BADGE_CLASS}>Director&apos;s Pick</span>
            <h2 className="mt-3 text-[22px] font-bold leading-snug text-black md:mt-4 md:text-[28px]">
              소망의 시작, 파격적이고 명료한 복음이 바꾸는 당신의 일상
            </h2>
            <p className="mt-2 line-clamp-3 text-sm font-medium text-black/80 md:mt-3 md:text-[15px]">
              디렉터 추천 콘텐츠 — 아티클, 비디오 등 엄선된 콘텐츠를 만나보세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReducedMotionHero({ slides }: { slides: DisplayEventHeroItem[] }) {
  const slide = slides[0]!
  return (
    <section className="mb-8 overflow-hidden rounded-xl bg-[#f2f2f2] shadow-sm ring-1 ring-black/5">
      <HeroSplitSlideShell slide={slide} />
    </section>
  )
}

export type HomeHeroCarouselProps = {
  forcedEventTypeCode?: string
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

  const onDotSelect = useCallback(
    (i: number) => {
      scheduleAutoplayResume()
      setTransitionEnabled(true)
      setActiveIndex(i)
    },
    [scheduleAutoplayResume],
  )

  const splitLoading = (
    <div className="flex min-h-[200px] w-full animate-pulse flex-col md:min-h-[260px] md:flex-row">
      <div className="aspect-video w-full bg-neutral-300 md:w-[58%] md:max-w-[58%]" />
      <div className="flex flex-1 flex-col gap-3 p-5 md:w-[42%] md:p-7">
        <div className="h-5 w-24 rounded-md bg-neutral-300" />
        <div className="h-8 w-full max-w-md rounded-md bg-neutral-200" />
        <div className="h-4 w-full rounded-md bg-neutral-200" />
        <div className="h-4 w-[85%] rounded-md bg-neutral-200" />
      </div>
    </div>
  )

  if (loading) {
    if (variant === 'inner') {
      return (
        <section className="mb-8 overflow-hidden rounded-xl bg-[#f2f2f2] sm:mb-10">
          {splitLoading}
        </section>
      )
    }
    return (
      <section className="mb-8 overflow-hidden rounded-xl bg-[#f2f2f2] ring-1 ring-black/5">{splitLoading}</section>
    )
  }

  if (!resolvedEventTypeCode) {
    return <StaticHero />
  }

  if (slides.length === 0) {
    return (
      <section className="mb-8 overflow-hidden rounded-xl bg-[#f2f2f2] ring-1 ring-black/5">
        <div className="flex min-h-[200px] flex-col md:flex-row">
          <div className="flex aspect-video w-full items-center justify-center bg-neutral-100 md:w-[58%]">
            <span className="px-4 text-center text-sm text-neutral-500">등록된 Hero 배너가 없습니다.</span>
          </div>
          <div className="flex flex-1 items-center border-t border-neutral-200/80 p-5 text-xs text-neutral-500 md:border-t-0 md:border-l md:w-[42%]">
            eventTypeCode: {resolvedEventTypeCode}
          </div>
        </div>
      </section>
    )
  }

  if (prefersReducedMotion) {
    return <ReducedMotionHero slides={slides} />
  }

  const chevronBtn =
    'z-[6] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-[2px] opacity-0 pointer-events-none transition-[opacity,background-color] duration-200 group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-black/60 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1f800] md:h-12 md:w-12'

  if (slides.length === 1) {
    return (
      <section className="mb-8 overflow-hidden rounded-xl bg-[#f2f2f2] shadow-sm ring-1 ring-black/5">
        <div ref={containerRef} className="relative w-full overflow-hidden">
          {containerW > 0 ? (
            <HeroSplitSlideShell slide={slides[0]!} cellWidth={containerW} />
          ) : (
            <div className="min-h-[220px] w-full bg-neutral-200 md:min-h-[280px]" aria-hidden />
          )}
        </div>
      </section>
    )
  }

  const translatePx = containerW > 0 ? activeIndex * containerW : 0

  return (
    <section className="mb-8 rounded-xl bg-[#f2f2f2] shadow-sm ring-1 ring-black/5">
      <div
        ref={containerRef}
        className="group relative w-full overflow-hidden rounded-xl"
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
                <HeroSplitSlideShell key={`${slide.displayEventId}-${i}`} slide={slide} cellWidth={containerW} />
              ))}
            </div>
            <button
              type="button"
              aria-label="이전 이벤트"
              className={`${chevronBtn} absolute left-2 top-1/3 -translate-y-1/2 md:left-5 md:top-1/2`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToPrev()
              }}
            >
              <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.25} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="다음 이벤트"
              className={`${chevronBtn} absolute right-2 top-1/3 -translate-y-1/2 md:right-auto md:left-[calc(58%-3.25rem)] md:top-1/2`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToNext()
              }}
            >
              <ChevronRight className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.25} aria-hidden />
            </button>
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end pb-4 pr-4 md:pb-6 md:pr-8">
              <div className="pointer-events-auto w-[min(100%,42%)] max-w-[320px]">
                <div className="flex justify-end">
                  <HeroDots
                    slides={slides}
                    activeIndex={activeIndex}
                    moduloLen={slides.length}
                    onSelect={onDotSelect}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-[220px] w-full bg-neutral-200 md:min-h-[280px]" aria-hidden />
        )}
      </div>
    </section>
  )
}

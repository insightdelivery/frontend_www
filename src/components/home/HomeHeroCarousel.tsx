'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchHeroDisplayEvents } from '@/services/displayEvent'
import type { DisplayEventHeroItem } from '@/types/displayEvent'
import { heroInternalHref } from '@/lib/heroRoutes'
import { resolveHeroEventTypeCode } from '@/lib/heroEventType'
import { getApiBaseURL } from '@/lib/axios'

const SLIDE_HOLD_MS = 5000
const SLIDE_TRANSITION_MS = 550

/** 히어로 이미지 항상 4:3 — 데스크톱 좌열 510px 너비에 맞춤, 모바일은 전체 너비 4:3 */
const HERO_BANNER_GRID_CLASS =
  'grid w-full grid-cols-1 grid-rows-[auto_auto] overflow-hidden md:grid-cols-[510px_minmax(0,1fr)] md:grid-rows-1 md:items-stretch'

const HERO_IMAGE_CELL_CLASS = 'relative w-full aspect-[4/3] shrink-0 overflow-hidden bg-cream-2'

const BADGE_CLASS =
  'inline-block bg-accent-lime px-[9px] py-[5px] text-[11px] font-bold uppercase tracking-[0.1em] text-ink-900'

const HERO_MOBILE_MQ = '(max-width: 767px)'

function subscribeHeroMobileLayout(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia(HERO_MOBILE_MQ)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getHeroMobileLayoutSnapshot() {
  if (typeof window === 'undefined') return false
  return window.matchMedia(HERO_MOBILE_MQ).matches
}

function getHeroMobileLayoutServerSnapshot() {
  return false
}

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
  /** 모바일: 모든 슬라이드 텍스트 영역 세로를 최대 높이에 맞출 때(px). 데스크톱에서는 무시 */
  mobileTextUniformMinPx?: number
}

/** Director's Pick — 좌 4:3 + 우 cream (wwwMainpagePlan / 프로토타입) */
function HeroSplitSlideShell({ slide, cellWidth, mobileTextUniformMinPx }: SplitSlideShellProps) {
  const title = slide.title || '제목 없음'
  const subtitle = (slide.subtitle || '').trim()
  const badge = slide.badgeText?.trim() || ''
  const bg = resolveHeroImageUrl(slide.imageUrl)
  const href = resolveSlideHref(slide)

  const body = (
    <div
      className={HERO_BANNER_GRID_CLASS}
      style={cellWidth ? { width: cellWidth } : undefined}
    >
      <div className={HERO_IMAGE_CELL_CLASS}>
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(.2,.6,.2,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950" />
        )}
      </div>
      <div
        data-hero-text-panel
        className="flex min-h-0 shrink-0 flex-col justify-center overflow-y-auto bg-cream px-6 py-5 md:h-full md:min-h-0 md:px-8 md:py-8"
        style={
          mobileTextUniformMinPx != null && mobileTextUniformMinPx > 0
            ? { minHeight: mobileTextUniformMinPx }
            : undefined
        }
      >
        <div>
          {badge ? <span className={BADGE_CLASS}>{badge}</span> : null}
          <h2 className="mt-4 text-[clamp(1.625rem,3.6vw,2.25rem)] font-black leading-tight tracking-[-0.03em] text-ink-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (href?.kind === 'internal') {
    return (
      <Link
        href={href.path}
        className="group block shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lime"
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
        className="group block shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lime"
        style={cellWidth ? { width: cellWidth } : undefined}
        aria-label={title}
      >
        {body}
      </a>
    )
  }
  return (
    <div className="group block shrink-0" style={cellWidth ? { width: cellWidth } : undefined}>
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
    <div
      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 shadow-sm"
      style={{ backgroundColor: 'rgba(15,15,15,0.08)' }}
    >
      {slides.map((s, i) => (
        <button
          key={s.displayEventId}
          type="button"
          aria-label={`배너 ${i + 1}로 이동`}
          aria-current={i === cur ? 'true' : undefined}
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            i === cur ? 'bg-ink-900' : 'bg-ink-900/30 hover:bg-ink-900/55'
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

function StaticHero({ variant = 'home' }: { variant?: 'home' | 'inner' }) {
  const pad = variant === 'home' ? 'pt-12 pb-6' : 'mb-8 sm:mb-10'
  return (
    <section className={pad}>
      <div className={HERO_BANNER_GRID_CLASS}>
        <div className={HERO_IMAGE_CELL_CLASS}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-900" />
        </div>
        <div className="flex min-h-0 shrink-0 flex-col justify-center overflow-y-auto bg-cream px-6 py-5 md:h-full md:min-h-0 md:px-8 md:py-8">
          <span className={BADGE_CLASS}>Director&apos;s Pick</span>
          <h2 className="mt-4 text-[clamp(1.625rem,3.6vw,2.25rem)] font-black leading-tight tracking-[-0.03em] text-ink-900">
            소망의 시작, 파격적이고 명료한 복음이 바꾸는 당신의 일상
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
            디렉터 추천 콘텐츠 — 아티클, 비디오 등 엄선된 콘텐츠를 만나보세요.
          </p>
        </div>
      </div>
    </section>
  )
}

function ReducedMotionHero({ slides, variant = 'home' }: { slides: DisplayEventHeroItem[]; variant?: 'home' | 'inner' }) {
  const slide = slides[0]!
  const pad = variant === 'home' ? 'pt-12 pb-6' : 'mb-8 sm:mb-10'
  return (
    <section className={pad}>
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

  const isHeroMobileLayout = useSyncExternalStore(
    subscribeHeroMobileLayout,
    getHeroMobileLayoutSnapshot,
    getHeroMobileLayoutServerSnapshot,
  )
  const [mobileHeroTextMinPx, setMobileHeroTextMinPx] = useState(0)

  useLayoutEffect(() => {
    if (!isHeroMobileLayout || !measureEnabled || slides.length === 0) {
      setMobileHeroTextMinPx(0)
      return
    }
    setMobileHeroTextMinPx(0)
  }, [slides, isHeroMobileLayout, measureEnabled])

  useLayoutEffect(() => {
    if (!isHeroMobileLayout) {
      return
    }
    if (!measureEnabled || slides.length === 0) {
      return
    }
    const root = containerRef.current
    if (!root || !containerW) return

    const measure = () => {
      const panels = root.querySelectorAll<HTMLElement>('[data-hero-text-panel]')
      if (!panels.length) return
      let max = 0
      panels.forEach((p) => {
        max = Math.max(max, p.getBoundingClientRect().height)
      })
      const next = Math.ceil(max)
      setMobileHeroTextMinPx((prev) => (prev === next ? prev : next))
    }

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(measure)
    })
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    ro.observe(root)
    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
    }
  }, [isHeroMobileLayout, measureEnabled, containerW, slides])

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
    <div className={`${HERO_BANNER_GRID_CLASS} animate-pulse`}>
      <div className={HERO_IMAGE_CELL_CLASS} />
      <div className="flex min-h-0 shrink-0 flex-col gap-3 overflow-hidden bg-cream px-6 py-5 md:h-full md:px-8 md:py-8">
        <div className="h-5 w-24 rounded-[3px] bg-ink-100" />
        <div className="h-8 w-full max-w-md rounded-[3px] bg-ink-100" />
        <div className="h-4 w-full rounded-[3px] bg-ink-100" />
        <div className="h-4 w-[85%] rounded-[3px] bg-ink-100" />
      </div>
    </div>
  )

  const sectionPad = variant === 'home' ? 'pt-12 pb-6' : 'mb-8 sm:mb-10'

  if (loading) {
    return <section className={sectionPad}>{splitLoading}</section>
  }

  if (!resolvedEventTypeCode) {
    return <StaticHero variant={variant} />
  }

  if (slides.length === 0) {
    return (
      <section className={sectionPad}>
        <div className={HERO_BANNER_GRID_CLASS}>
          <div className={HERO_IMAGE_CELL_CLASS}>
            <div className="absolute inset-0 flex items-center justify-center bg-cream-2">
              <span className="px-4 text-center text-sm text-ink-500">등록된 Hero 배너가 없습니다.</span>
            </div>
          </div>
          <div className="flex min-h-0 shrink-0 items-center overflow-y-auto border-t border-ink-100 bg-cream px-6 py-5 text-xs text-ink-500 md:h-full md:border-t-0 md:border-l md:border-ink-100">
            eventTypeCode: {resolvedEventTypeCode}
          </div>
        </div>
      </section>
    )
  }

  if (prefersReducedMotion) {
    return <ReducedMotionHero slides={slides} variant={variant} />
  }

  const chevronBtn =
    'z-[6] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-100 bg-paper text-ink-900 shadow-[0_4px_16px_rgba(0,0,0,0.12)] opacity-0 pointer-events-none transition-[opacity,background-color,color,border-color] duration-200 group-hover:pointer-events-auto group-hover:opacity-100 hover:border-ink-900 hover:bg-ink-900 hover:text-white focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lime md:h-11 md:w-11'

  if (slides.length === 1) {
    return (
      <section className={sectionPad}>
        <div ref={containerRef} className="group relative w-full overflow-hidden">
          {containerW > 0 ? (
            <HeroSplitSlideShell
              slide={slides[0]!}
              cellWidth={containerW}
              mobileTextUniformMinPx={isHeroMobileLayout ? mobileHeroTextMinPx : undefined}
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-cream-2" aria-hidden />
          )}
        </div>
      </section>
    )
  }

  const translatePx = containerW > 0 ? activeIndex * containerW : 0

  return (
    <section className={sectionPad}>
      <div
        ref={containerRef}
        className="group relative w-full overflow-hidden"
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
                <HeroSplitSlideShell
                  key={`${slide.displayEventId}-${i}`}
                  slide={slide}
                  cellWidth={containerW}
                  mobileTextUniformMinPx={isHeroMobileLayout ? mobileHeroTextMinPx : undefined}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="이전 이벤트"
              className={`${chevronBtn} absolute left-2 top-1/2 -translate-y-1/2 md:left-4`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToPrev()
              }}
            >
              <ChevronLeft className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={2.25} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="다음 이벤트"
              className={`${chevronBtn} absolute right-2 top-1/2 -translate-y-1/2 md:right-4`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToNext()
              }}
            >
              <ChevronRight className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={2.25} aria-hidden />
            </button>
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end pb-4 pr-4 md:pb-5 md:pr-6">
              <div className="pointer-events-auto max-w-[min(100%,320px)]">
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
          <div className="w-full aspect-[4/3] bg-cream-2" aria-hidden />
        )}
      </div>
    </section>
  )
}

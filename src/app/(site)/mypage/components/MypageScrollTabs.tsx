'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MYPAGE_TABS } from './MypageTabs'
import { isMypageTabActive } from './mypageNavUtils'
import { cn } from '@/lib/utils'

const SCROLL_STEP = 160

/**
 * 모바일 탭: 가로 스크롤 + 좌우 화살표 + 활성 탭 중앙 정렬 (mypage.md § 모바일 탭 명령서)
 * 화살표는 탭 행과 동일 flex 줄에서 items-center로 세로 정렬 (글자와 어긋남 방지)
 */
export default function MypageScrollTabs() {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeLabelRef = useRef<HTMLSpanElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = scrollWidth - clientWidth
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(max > 2 && scrollLeft < max - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollHints()
    el.addEventListener('scroll', updateScrollHints, { passive: true })
    const ro = new ResizeObserver(() => updateScrollHints())
    ro.observe(el)
    window.addEventListener('resize', updateScrollHints)
    return () => {
      el.removeEventListener('scroll', updateScrollHints)
      ro.disconnect()
      window.removeEventListener('resize', updateScrollHints)
    }
  }, [updateScrollHints, pathname])

  useEffect(() => {
    const t = window.setTimeout(() => {
      activeLabelRef.current?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }, 0)
    return () => window.clearTimeout(t)
  }, [pathname])

  const scrollByDir = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' })
  }

  const arrowBtnClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#111827] shadow-sm sm:h-9 sm:w-9'

  return (
    <div
      className={cn(
        'flex items-center',
        (canScrollLeft || canScrollRight) && 'gap-1.5 sm:gap-2'
      )}
    >
      <div className="flex shrink-0 items-center justify-center">
        {canScrollLeft ? (
          <button
            type="button"
            aria-label="이전 탭"
            onClick={() => scrollByDir(-1)}
            className={arrowBtnClass}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </button>
        ) : (
          <span className="inline-block w-0 overflow-hidden" aria-hidden />
        )}
      </div>

      <div className="relative min-w-0 flex-1">
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent sm:w-8',
            !canScrollLeft && 'opacity-0'
          )}
          aria-hidden
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent sm:w-8',
            !canScrollRight && 'opacity-0'
          )}
          aria-hidden
        />

        <div
          ref={scrollRef}
          className={cn(
            'mypage-tabs-scroll flex gap-6 overflow-x-auto whitespace-nowrap pb-px sm:gap-8',
            'snap-x snap-mandatory scrollbar-hide'
          )}
        >
          {MYPAGE_TABS.map((tab) => {
            const active = isMypageTabActive(pathname, tab.path)
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={cn(
                  '-mb-px shrink-0 snap-start border-b-2 border-transparent pb-[0px] text-[16px] leading-6 transition-colors hover:text-[#111827]',
                  active ? 'font-bold text-black' : 'font-medium text-[#9ca3af]'
                )}
                style={{
                  borderBottomColor: active ? '#E1F800' : 'transparent',
                }}
              >
                <span
                  ref={active ? activeLabelRef : undefined}
                  className="inline-block whitespace-nowrap"
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center">
        {canScrollRight ? (
          <button
            type="button"
            aria-label="다음 탭"
            onClick={() => scrollByDir(1)}
            className={arrowBtnClass}
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </button>
        ) : (
          <span className="inline-block w-0 overflow-hidden" aria-hidden />
        )}
      </div>
    </div>
  )
}

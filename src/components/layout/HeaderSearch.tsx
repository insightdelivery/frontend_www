'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { fetchRecommendedSearchKeywords } from '@/lib/recommendedSearchKeywords'
import { normalizeSearchQuery } from '@/lib/searchQuery'
import { getRecentSearches, removeRecentSearch, saveRecentSearch } from '@/lib/recentSearches'
import { useSearchChrome } from '@/contexts/SearchChromeContext'

type HeaderSearchProps = {
  isOpen: boolean
  onClose: () => void
  onSearch?: (query: string) => void
  /** Toolbar·MainBar와 동일 — `siteShellMaxWidthClass` */
  shellMaxClass: string
}

type RecentDropdownRect = { top: number; left: number; width: number }

export default function HeaderSearch({ isOpen, onClose, onSearch, shellMaxClass }: HeaderSearchProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const qFromUrl = searchParams.get('q') ?? ''
  const { hideRecentSearchesInHeader, setHeaderSearchInputFocused } = useSearchChrome()

  const panelRef = useRef<HTMLDivElement>(null)
  const recentAnchorRef = useRef<HTMLDivElement>(null)
  const recommendedSectionRef = useRef<HTMLDivElement>(null)
  const headerInputBlurFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** `hideRecent…` 갱신 전에도 expandRecent 허용 — SearchPageContent effect와 동기 */
  const headerSearchInputFocusedRef = useRef(false)
  const recentDropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recentBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [query, setQuery] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isRecentExpanded, setIsRecentExpanded] = useState(false)
  const [recentDropdownRect, setRecentDropdownRect] = useState<RecentDropdownRect | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  const clearRecentBlurTimeout = () => {
    if (recentBlurTimeoutRef.current) {
      clearTimeout(recentBlurTimeoutRef.current)
      recentBlurTimeoutRef.current = null
    }
  }

  const clearHeaderInputBlurFocusTimeout = () => {
    if (headerInputBlurFocusTimeoutRef.current) {
      clearTimeout(headerInputBlurFocusTimeoutRef.current)
      headerInputBlurFocusTimeoutRef.current = null
    }
  }

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    void fetchRecommendedSearchKeywords().then((k) => {
      if (!cancelled) setKeywords(k)
    })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      if (recentBlurTimeoutRef.current) {
        clearTimeout(recentBlurTimeoutRef.current)
        recentBlurTimeoutRef.current = null
      }
      clearHeaderInputBlurFocusTimeout()
      headerSearchInputFocusedRef.current = false
      setHeaderSearchInputFocused(false)
      setIsRecentExpanded(false)
    }
  }, [isOpen, setHeaderSearchInputFocused])

  useEffect(() => {
    if (!isOpen || pathname !== '/search') return
    setQuery(normalizeSearchQuery(qFromUrl))
  }, [isOpen, pathname, qFromUrl])

  useEffect(() => {
    if (!isOpen) return

    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      const inPanel = panelRef.current?.contains(t)
      const inRecent = recentDropdownRef.current?.contains(t) ?? false
      if (!inPanel && !inRecent) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  useLayoutEffect(() => {
    if (!isRecentExpanded || !recentAnchorRef.current) {
      setRecentDropdownRect(null)
      return
    }

    const el = recentAnchorRef.current
    const update = () => {
      const r = el.getBoundingClientRect()
      const maxW = 400
      setRecentDropdownRect({
        top: r.bottom + 8,
        left: r.left,
        width: Math.min(r.width, maxW),
      })
    }

    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      ro?.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [isRecentExpanded])

  useEffect(() => {
    if (!isOpen) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const submitSearch = (raw: string) => {
    const kw = normalizeSearchQuery(raw)
    if (!kw) return
    saveRecentSearch(kw)
    setRecentSearches(getRecentSearches())
    onSearch?.(kw)
    // 검색 실행 후 본문·결과로 포커스가 가도록 입력란 포커스 제거
    queueMicrotask(() => {
      inputRef.current?.blur()
    })
  }

  const handleRemoveRecent = (keyword: string) => {
    setRecentSearches(removeRecentSearch(keyword))
  }

  const expandRecent = () => {
    if (hideRecentSearchesInHeader && !headerSearchInputFocusedRef.current) return
    clearRecentBlurTimeout()
    setRecentSearches(getRecentSearches())
    setIsRecentExpanded(true)
  }

  const scheduleCollapseRecent = () => {
    clearRecentBlurTimeout()
    recentBlurTimeoutRef.current = setTimeout(() => {
      setIsRecentExpanded(false)
      recentBlurTimeoutRef.current = null
    }, 200)
  }

  useEffect(() => {
    return () => {
      clearRecentBlurTimeout()
      clearHeaderInputBlurFocusTimeout()
    }
  }, [])

  useEffect(() => {
    if (hideRecentSearchesInHeader) {
      clearRecentBlurTimeout()
      setIsRecentExpanded(false)
    }
  }, [hideRecentSearchesInHeader])

  const shellClasses = reduceMotion
    ? isOpen
      ? 'max-h-[min(60vh,480px)] opacity-100 flex min-h-0 flex-col overflow-hidden'
      : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
    : [
        'transition-all duration-300 ease-in-out',
        isOpen
          ? 'max-h-[min(60vh,480px)] opacity-100 flex min-h-0 flex-col overflow-hidden'
          : 'max-h-0 opacity-0 overflow-hidden pointer-events-none',
      ].join(' ')

  return (
    <div
      id="header-search-panel"
      role="search"
      aria-label="사이트 검색"
      aria-hidden={!isOpen}
      className={`w-full ${shellClasses}`}
    >
      <div
        ref={panelRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-black/10 bg-gray-100 text-black"
      >
        <div className={`mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col ${shellMaxClass}`}>
          <div className="relative z-30 shrink-0 px-6 pt-4 pb-2">
            <div ref={recentAnchorRef} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-black/50" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  expandRecent()
                }}
                onPointerDown={(e) => {
                  if (e.nativeEvent.isTrusted) {
                    headerSearchInputFocusedRef.current = true
                    setHeaderSearchInputFocused(true)
                  }
                  expandRecent()
                }}
                onFocus={(e) => {
                  clearRecentBlurTimeout()
                  clearHeaderInputBlurFocusTimeout()
                  if (e.nativeEvent.isTrusted) {
                    headerSearchInputFocusedRef.current = true
                    setHeaderSearchInputFocused(true)
                    expandRecent()
                    requestAnimationFrame(() => {
                      recommendedSectionRef.current?.scrollIntoView({
                        block: 'nearest',
                        behavior: 'smooth',
                      })
                    })
                  }
                }}
                onBlur={() => {
                  scheduleCollapseRecent()
                  headerInputBlurFocusTimeoutRef.current = setTimeout(() => {
                    headerSearchInputFocusedRef.current = false
                    setHeaderSearchInputFocused(false)
                    headerInputBlurFocusTimeoutRef.current = null
                  }, 200)
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  // 한글 IME: 조합 중 Enter는 확정용 — 검색 제출과 겹치면 끝글자가 중복될 수 있음
                  if (e.nativeEvent.isComposing) return
                  const raw = (e.currentTarget as HTMLInputElement).value
                  submitSearch(raw)
                }}
                placeholder="검색어를 입력하세요"
                className="min-h-7 w-full min-w-0 flex-1 bg-transparent text-base outline-none md:min-h-7 md:text-sm"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="검색 닫기"
                className="shrink-0 rounded-full p-1.5 hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

          </div>

          {typeof document !== 'undefined' &&
            !hideRecentSearchesInHeader &&
            isRecentExpanded &&
            recentDropdownRect &&
            createPortal(
              <div
                ref={recentDropdownRef}
                role="listbox"
                aria-label="최근 검색어"
                className="max-h-[min(50vh,280px)] max-w-[400px] overflow-y-auto rounded-lg border border-black/10 bg-white shadow-lg"
                style={{
                  position: 'fixed',
                  top: recentDropdownRect.top,
                  left: recentDropdownRect.left,
                  width: recentDropdownRect.width,
                  zIndex: 220,
                }}
              >
                <div className="p-3">
                  <h3 className="mb-2 text-sm font-bold text-black/80">최근 검색어</h3>
                  {recentSearches.length === 0 ? (
                    <p className="text-sm text-black/45">최근 검색어가 없습니다</p>
                  ) : (
                    <ul className="divide-y divide-black/10 overflow-hidden rounded-md border border-black/5">
                      {recentSearches.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-stretch">
                          <button
                            type="button"
                            role="option"
                            className="min-w-0 flex-1 px-3 py-2.5 text-left text-sm text-black hover:bg-black/[0.04]"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              submitSearch(item)
                            }}
                          >
                            {item}
                          </button>
                          <button
                            type="button"
                            aria-label={`${item} 삭제`}
                            className="shrink-0 px-3 text-sm text-black/40 hover:bg-black/[0.04] hover:text-red-600"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRemoveRecent(item)
                            }}
                          >
                            <X className="mx-auto h-4 w-4" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>,
              document.body
            )}

          {keywords.length > 0 && (
            <div
              ref={recommendedSectionRef}
              className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2"
            >
              <h3 className="mb-3 text-lg font-bold">인디 추천 검색어</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((k, i) => (
                  <button
                    key={`${k}-${i}`}
                    type="button"
                    onClick={() => submitSearch(k)}
                    className="rounded-full border border-black/20 bg-white px-3 py-1 text-sm hover:bg-black/[0.03]"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

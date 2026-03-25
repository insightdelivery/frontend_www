'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { fetchRecommendedSearchKeywords } from '@/lib/recommendedSearchKeywords'

type HeaderSearchProps = {
  isOpen: boolean
  onClose: () => void
  onSearch?: (query: string) => void
}

export default function HeaderSearch({ isOpen, onClose, onSearch }: HeaderSearchProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [reduceMotion, setReduceMotion] = useState(false)

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
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

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

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword)
  }

  const shellClasses = reduceMotion
    ? isOpen
      ? 'max-h-[min(60vh,480px)] opacity-100 overflow-y-auto'
      : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
    : [
        'transition-all duration-300 ease-in-out',
        isOpen
          ? 'max-h-[min(60vh,480px)] opacity-100 overflow-y-auto'
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
      <div ref={panelRef} className="w-full border-t border-black/10 bg-gray-100 text-black">
        <div className="mx-auto w-full max-w-[1220px]">
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-black/50" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearch?.(query)
                  }
                }}
                placeholder="검색어를 입력하세요"
                className="min-h-11 w-full min-w-0 flex-1 bg-transparent text-base outline-none md:min-h-10 md:text-sm"
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
          {keywords.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="mb-3 text-lg font-bold">인디 추천 검색어</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((k, i) => (
                  <button
                    key={`${k}-${i}`}
                    type="button"
                    onClick={() => handleKeywordClick(k)}
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

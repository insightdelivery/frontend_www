'use client'

import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { normalizeSearchQuery } from '@/lib/searchQuery'
import { fetchUnifiedSearch } from '@/services/search'
import type { SearchContentItem, UnifiedSearchResult } from '@/types/search'
import { ensureSysCodeLoaded } from '@/lib/syscode'
import { useSearchChrome } from '@/contexts/SearchChromeContext'
import SearchContentSection from '@/components/search/SearchContentSection'
import SearchSkeleton from '@/components/search/SearchSkeleton'

const emptyBuckets: UnifiedSearchResult = { article: [], video: [], seminar: [] }

function sortSearchByPriority(items: SearchContentItem[]): SearchContentItem[] {
  return [...items].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
}

function isCanceled(e: unknown): boolean {
  if (axios.isAxiosError(e)) {
    return e.code === 'ERR_CANCELED' || e.name === 'CanceledError'
  }
  if (e && typeof e === 'object') {
    const o = e as { name?: string }
    return o.name === 'AbortError'
  }
  return false
}

export default function SearchPageContent() {
  const searchParams = useSearchParams()
  const query = normalizeSearchQuery(searchParams.get('q'))
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const { setHideRecentSearchesInHeader, headerSearchInputFocused } = useSearchChrome()

  useEffect(() => {
    void ensureSysCodeLoaded()
  }, [])

  useEffect(() => {
    if (!query) {
      setDebouncedQuery('')
      return
    }
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const [data, setData] = useState<UnifiedSearchResult | null>(null)
  const [loading, setLoading] = useState(() => query.length > 0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!debouncedQuery) {
      setData(emptyBuckets)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const myId = ++requestIdRef.current
    setLoading(true)

    fetchUnifiedSearch(debouncedQuery, controller.signal)
      .then((res) => {
        if (myId !== requestIdRef.current) return
        setData({
          article: Array.isArray(res.article) ? res.article : [],
          video: Array.isArray(res.video) ? res.video : [],
          seminar: Array.isArray(res.seminar) ? res.seminar : [],
        })
      })
      .catch((err) => {
        if (controller.signal.aborted || isCanceled(err)) return
        if (myId !== requestIdRef.current) return
        setData(null)
      })
      .finally(() => {
        if (myId === requestIdRef.current) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedQuery])

  useEffect(() => {
    if (!debouncedQuery) {
      setHideRecentSearchesInHeader(false)
      return
    }
    if (loading) {
      setHideRecentSearchesInHeader(false)
      return
    }
    if (headerSearchInputFocused) {
      setHideRecentSearchesInHeader(false)
      return
    }
    // 검색 요청이 완료되면(결과 0건·API 오류 포함) 헤더 최근 검색어 목록 숨김 — 입력에 다시 포커스하면 해제
    setHideRecentSearchesInHeader(true)
  }, [debouncedQuery, loading, headerSearchInputFocused, setHideRecentSearchesInHeader])

  useEffect(() => {
    return () => setHideRecentSearchesInHeader(false)
  }, [setHideRecentSearchesInHeader])

  if (loading) {
    return (
      <main className="min-h-[40vh] bg-white px-3 pt-2 pb-6 text-black md:px-6 md:pb-8">
        <SearchSkeleton />
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-[40vh] bg-white px-3 pt-2 pb-6 text-black md:px-6 md:pb-8">
        <div className="mx-auto w-full max-w-[900px]">
          <p className="text-gray-600">검색 결과를 불러오지 못했습니다.</p>
        </div>
      </main>
    )
  }

  const total =
    (data.article?.length ?? 0) + (data.video?.length ?? 0) + (data.seminar?.length ?? 0)

  return (
    <main className="min-h-[40vh] bg-white px-3 pt-2 pb-6 text-black md:px-6 md:pb-8">
      <div className="mx-auto w-full max-w-[900px]">
        {!debouncedQuery ? (
          <p className="text-gray-600">검색어를 입력한 뒤 검색해 주세요.</p>
        ) : (
          <>
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                &quot;{debouncedQuery}&quot; 결과{' '}
                <span className="font-medium text-gray-800">{total}</span>건
              </p>
            </div>
            {total > 0 ? (
              <div className="mt-4">
                <SearchContentSection
                  key={`${debouncedQuery}-article`}
                  title="아티클"
                  kind="article"
                  items={sortSearchByPriority(data.article)}
                />
                <SearchContentSection
                  key={`${debouncedQuery}-video`}
                  title="비디오"
                  kind="video"
                  items={sortSearchByPriority(data.video)}
                />
                <SearchContentSection
                  key={`${debouncedQuery}-seminar`}
                  title="세미나"
                  kind="seminar"
                  items={sortSearchByPriority(data.seminar)}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}

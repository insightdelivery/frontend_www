'use client'

import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { normalizeSearchQuery } from '@/lib/searchQuery'
import { fetchUnifiedSearch } from '@/services/search'
import type { UnifiedSearchResult } from '@/types/search'
import { ensureSysCodeLoaded } from '@/lib/syscode'
import SearchBar from '@/components/search/SearchBar'
import SearchContentSection from '@/components/search/SearchContentSection'
import SearchEmptyResult from '@/components/search/SearchEmptyResult'
import SearchSkeleton from '@/components/search/SearchSkeleton'

const emptyBuckets: UnifiedSearchResult = { article: [], video: [], seminar: [] }

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

  if (loading) {
    return (
      <main className="min-h-[40vh] bg-white text-black">
        <SearchSkeleton />
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-[40vh] bg-white px-4 py-10 text-black md:px-8">
        <div className="mx-auto max-w-[1220px]">
          <h1 className="text-xl font-bold">검색</h1>
          <SearchBar defaultValue={query} />
          <p className="mt-8 text-gray-600">검색 결과를 불러오지 못했습니다.</p>
        </div>
      </main>
    )
  }

  const total =
    (data.article?.length ?? 0) + (data.video?.length ?? 0) + (data.seminar?.length ?? 0)

  return (
    <main className="min-h-[40vh] bg-white px-4 py-10 text-black md:px-8">
      <div className="mx-auto max-w-[1220px]">
        <h1 className="text-2xl font-black text-gray-900">검색</h1>
        <SearchBar defaultValue={query} />

        {!debouncedQuery ? (
          <p className="mt-8 text-gray-600">검색어를 입력한 뒤 검색해 주세요.</p>
        ) : total === 0 ? (
          <SearchEmptyResult />
        ) : (
          <>
            <p className="mt-4 text-sm text-gray-500">
              &quot;{debouncedQuery}&quot; 결과{' '}
              <span className="font-medium text-gray-800">{total}</span>건
            </p>
            <div className="mt-8">
              <SearchContentSection
                key={`${debouncedQuery}-article`}
                title="아티클"
                kind="article"
                items={data.article}
              />
              <SearchContentSection
                key={`${debouncedQuery}-video`}
                title="비디오"
                kind="video"
                items={data.video}
              />
              <SearchContentSection
                key={`${debouncedQuery}-seminar`}
                title="세미나"
                kind="seminar"
                items={data.seminar}
              />
            </div>
          </>
        )}
      </div>
    </main>
  )
}

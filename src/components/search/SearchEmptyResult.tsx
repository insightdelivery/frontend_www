'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchRecommendedSearchKeywords } from '@/lib/recommendedSearchKeywords'

export default function SearchEmptyResult() {
  const router = useRouter()
  const [keywords, setKeywords] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchRecommendedSearchKeywords().then((k) => {
      if (!cancelled) setKeywords(k)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mt-10">
      <p className="text-lg font-bold text-gray-900">검색 결과가 없습니다.</p>
      <p className="mt-2 text-gray-500">이런 검색어는 어떠세요?</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {keywords.slice(0, 15).map((k, index) => (
          <button
            key={`${k}-${index}`}
            type="button"
            className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              const url = `/search?q=${encodeURIComponent(k)}`
              router.replace(url)
              router.refresh()
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

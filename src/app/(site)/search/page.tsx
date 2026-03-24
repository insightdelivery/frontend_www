'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { normalizeSearchQuery } from '@/lib/searchQuery'
import SearchPageContent from '@/components/search/SearchPageContent'
import SearchSkeleton from '@/components/search/SearchSkeleton'

/** `q` 변경 시 리마운트 → debouncedQuery·로딩 상태가 URL과 어긋나지 않음 */
function SearchPageKeyed() {
  const q = normalizeSearchQuery(useSearchParams().get('q'))
  return <SearchPageContent key={q || '__empty__'} />
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[40vh] bg-white text-black">
          <SearchSkeleton />
        </main>
      }
    >
      <SearchPageKeyed />
    </Suspense>
  )
}

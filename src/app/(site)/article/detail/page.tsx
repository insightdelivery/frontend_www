'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ArticleDetailContent from '@/components/article/detail/ArticleDetailContent'
import TopButton from '@/components/common/TopButton'

function ArticleDetailInner() {
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const id = idParam ?? ''
  const shareExpired = searchParams.get('share_expired') === '1'
  const fromShareLink = searchParams.get('from_share') === '1'

  return (
    <main className="bg-white min-h-screen">
      <ArticleDetailContent id={id} shareExpired={shareExpired} fromShareLink={fromShareLink} />
      <TopButton />
    </main>
  )
}

export default function ArticleDetailPage() {
  return (
    <Suspense fallback={
      <main className="bg-white min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    }>
      <ArticleDetailInner />
    </Suspense>
  )
}

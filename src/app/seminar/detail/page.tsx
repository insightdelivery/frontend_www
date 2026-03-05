'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import VideoSeminarDetailContent from '@/components/content-detail/VideoSeminarDetailContent'

function SeminarDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || '1'

  return (
    <main className="bg-white min-h-screen">
      <VideoSeminarDetailContent type="seminar" id={id} />
    </main>
  )
}

export default function SeminarDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-white min-h-screen flex items-center justify-center">
          <p className="text-gray-500">로딩 중...</p>
        </main>
      }
    >
      <SeminarDetailInner />
    </Suspense>
  )
}

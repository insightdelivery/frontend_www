'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import VideoSeminarDetailContent from '@/components/content-detail/VideoSeminarDetailContent'

function VideoDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || '1'

  return (
    <main className="bg-white min-h-screen">
      <VideoSeminarDetailContent type="video" id={id} />
    </main>
  )
}

export default function VideoDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-white min-h-screen flex items-center justify-center">
          <p className="text-gray-500">로딩 중...</p>
        </main>
      }
    >
      <VideoDetailInner />
    </Suspense>
  )
}

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import VideoSeminarDetailContent from '@/components/content-detail/VideoSeminarDetailContent'
import TopButton from '@/components/common/TopButton'
import KakaoChannelAddButton from '@/components/common/KakaoChannelAddButton'

function SeminarDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const shareExpired = searchParams.get('share_expired') === '1'

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-center text-gray-600">올바른 콘텐츠 id가 필요합니다. (?id=)</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <VideoSeminarDetailContent type="seminar" id={id} shareExpired={shareExpired} />
      <KakaoChannelAddButton />
      <TopButton />
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

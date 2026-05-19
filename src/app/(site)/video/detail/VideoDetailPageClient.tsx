'use client'

import VideoSeminarDetailContent from '@/components/content-detail/VideoSeminarDetailContent'
import TopButton from '@/components/common/TopButton'
import KakaoChannelAddButton from '@/components/common/KakaoChannelAddButton'

export default function VideoDetailPageClient({
  id,
  shareExpired,
}: {
  id: string
  shareExpired: boolean
}) {
  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-center text-gray-600">올바른 콘텐츠 id가 필요합니다. (?id=)</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <VideoSeminarDetailContent type="video" id={id} shareExpired={shareExpired} />
      <KakaoChannelAddButton />
      <TopButton />
    </main>
  )
}

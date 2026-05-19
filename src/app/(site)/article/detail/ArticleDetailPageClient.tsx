'use client'

import ArticleDetailContent from '@/components/article/detail/ArticleDetailContent'
import TopButton from '@/components/common/TopButton'
import KakaoChannelAddButton from '@/components/common/KakaoChannelAddButton'

export default function ArticleDetailPageClient({
  id,
  shareExpired,
  fromShareLink,
}: {
  id: string
  shareExpired: boolean
  fromShareLink: boolean
}) {
  return (
    <main className="bg-white min-h-screen">
      <ArticleDetailContent id={id} shareExpired={shareExpired} fromShareLink={fromShareLink} />
      <KakaoChannelAddButton />
      <TopButton />
    </main>
  )
}

import type { Metadata } from 'next'
import { buildArticleDetailMetadata } from '@/lib/seo/buildDetailMetadata'
import ArticleDetailPageClient from './ArticleDetailPageClient'

type PageProps = {
  searchParams: Promise<{
    id?: string
    share_expired?: string
    from_share?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  return buildArticleDetailMetadata(sp.id)
}

export default async function ArticleDetailPage({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <ArticleDetailPageClient
      id={sp.id ?? ''}
      shareExpired={sp.share_expired === '1'}
      fromShareLink={sp.from_share === '1'}
    />
  )
}

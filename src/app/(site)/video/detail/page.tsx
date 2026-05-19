import type { Metadata } from 'next'
import { buildVideoDetailMetadata } from '@/lib/seo/buildDetailMetadata'
import VideoDetailPageClient from './VideoDetailPageClient'

type PageProps = {
  searchParams: Promise<{
    id?: string
    share_expired?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  return buildVideoDetailMetadata(sp.id)
}

export default async function VideoDetailPage({ searchParams }: PageProps) {
  const sp = await searchParams
  return <VideoDetailPageClient id={sp.id ?? ''} shareExpired={sp.share_expired === '1'} />
}

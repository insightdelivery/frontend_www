import type { Metadata } from 'next'
import { buildSeminarDetailMetadata } from '@/lib/seo/buildDetailMetadata'
import SeminarDetailPageClient from './SeminarDetailPageClient'

type PageProps = {
  searchParams: Promise<{
    id?: string
    share_expired?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  return buildSeminarDetailMetadata(sp.id)
}

export default async function SeminarDetailPage({ searchParams }: PageProps) {
  const sp = await searchParams
  return <SeminarDetailPageClient id={sp.id ?? ''} shareExpired={sp.share_expired === '1'} />
}

import { notFound } from 'next/navigation'
import { HomepageDocBody } from '@/components/homepage/HomepageDocBody'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import { fetchPublicHomepageDocAtBuild } from '@/services/homepageDoc'

export async function TermsDocPage() {
  const doc = await fetchPublicHomepageDocAtBuild('terms_of_service')
  if (!doc) notFound()
  const title = doc.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES.terms_of_service
  const html = sanitizeHomepageHtml(doc.bodyHtml || '')
  return <HomepageDocBody title={title} html={html} />
}

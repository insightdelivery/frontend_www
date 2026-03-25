import { notFound } from 'next/navigation'
import { HomepageDocBody } from '@/components/homepage/HomepageDocBody'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import { fetchPublicHomepageDocAtBuild } from '@/services/homepageDoc'

export async function PrivacyDocPage() {
  const doc = await fetchPublicHomepageDocAtBuild('privacy_policy')
  if (!doc) notFound()
  const title = doc.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES.privacy_policy
  const html = sanitizeHomepageHtml(doc.bodyHtml || '')
  return <HomepageDocBody title={title} html={html} />
}

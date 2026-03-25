import type { Metadata } from 'next'
import { fetchPublicHomepageDoc } from '@/services/homepageDoc'
import type { HomepageDocType } from '@/constants/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'

export async function homepageDocMetadata(docType: HomepageDocType): Promise<Metadata> {
  const doc = await fetchPublicHomepageDoc(docType)
  const fallback = HOMEPAGE_DOC_DEFAULT_TITLES[docType]
  const t = doc?.title?.trim() || fallback
  return {
    title: `${t} | InDe`,
    description: `${t} — InDe`,
  }
}

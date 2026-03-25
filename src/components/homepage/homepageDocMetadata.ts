import type { Metadata } from 'next'
import { fetchPublicHomepageDoc, fetchPublicHomepageDocAtBuild } from '@/services/homepageDoc'
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

/** 정적 export용 라우트 — 빌드 시 API 결과로 메타 고정 */
export async function homepageDocMetadataAtBuild(docType: HomepageDocType): Promise<Metadata> {
  const doc = await fetchPublicHomepageDocAtBuild(docType)
  const fallback = HOMEPAGE_DOC_DEFAULT_TITLES[docType]
  const t = doc?.title?.trim() || fallback
  return {
    title: `${t} | InDe`,
    description: `${t} — InDe`,
  }
}

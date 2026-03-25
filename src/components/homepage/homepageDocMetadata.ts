import type { Metadata } from 'next'
import type { HomepageDocType } from '@/constants/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'

/** 클라이언트에서 API로 제목을 가져오므로, 초기 메타는 기본 제목만(탭은 로드 후 `document.title` 갱신 가능) */
export function homepageDocMetadataFallback(docType: HomepageDocType): Metadata {
  const t = HOMEPAGE_DOC_DEFAULT_TITLES[docType]
  return {
    title: `${t} | InDe`,
    description: `${t} — InDe`,
  }
}

/** wwwDocEtc.md §2.3 */
export const HOMEPAGE_DOC_TYPES_ORDERED = [
  'company_intro',
  'terms_of_service',
  'privacy_policy',
  'article_copyright',
  'video_copyright',
  'seminar_copyright',
  'recommended_search',
  'external_links',
] as const

export type HomepageDocType = (typeof HOMEPAGE_DOC_TYPES_ORDERED)[number]

export const HOMEPAGE_DOC_DEFAULT_TITLES: Record<HomepageDocType, string> = {
  company_intro: '회사소개',
  terms_of_service: '이용약관',
  privacy_policy: '개인정보취급방침',
  article_copyright: '아티클 저작권',
  video_copyright: '비디오 저작권',
  seminar_copyright: '세미나 저작권',
  recommended_search: '추천검색어',
  external_links: '외부링크',
}

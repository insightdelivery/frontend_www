/**
 * contentTypeCode(sysCodeSid) → 내부 경로 (의미 문자열 분기 금지)
 * 로더 매핑과 동일 SID를 유지 (content_resolution.py)
 */
export const HERO_CONTENT_ROUTE_SIDS = {
  ARTICLE: 'SYS26320B010',
  VIDEO: 'SYS26320B011',
  SEMINAR: 'SYS26320B012',
} as const

export function heroInternalHref(contentTypeCode: string, contentId: number): string {
  switch (contentTypeCode) {
    case HERO_CONTENT_ROUTE_SIDS.ARTICLE:
      return `/article/detail/?id=${contentId}`
    case HERO_CONTENT_ROUTE_SIDS.VIDEO:
      return `/video/detail/?id=${contentId}`
    case HERO_CONTENT_ROUTE_SIDS.SEMINAR:
      return `/seminar/detail/?id=${contentId}`
    default:
      return '/'
  }
}

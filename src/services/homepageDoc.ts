import type { HomepageDocPayload } from '@/types/homepageDoc'

/** 공개 홈페이지 문서 API JSON → 페이로드 (서버/클라 공통, 부작용 없음) */
export function unwrapHomepageDocApi(data: unknown): HomepageDocPayload | null {
  const d = data as { IndeAPIResponse?: { ErrorCode?: string; Result?: HomepageDocPayload } }
  const wrap = d?.IndeAPIResponse
  if (!wrap || wrap.ErrorCode !== '00' || wrap.Result == null) return null
  return wrap.Result
}

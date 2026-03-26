import axios from 'axios'
import api from '@/lib/api'
import type { HomepageDocType } from '@/constants/homepageDoc'
import type { HomepageDocPayload } from '@/types/homepageDoc'

/** 공개 홈페이지 문서 API JSON → 페이로드 (서버/클라 공통, 부작용 없음) */
export function unwrapHomepageDocApi(data: unknown): HomepageDocPayload | null {
  const d = data as { IndeAPIResponse?: { ErrorCode?: string; Result?: HomepageDocPayload } }
  const wrap = d?.IndeAPIResponse
  if (!wrap || wrap.ErrorCode !== '00' || wrap.Result == null) return null
  return wrap.Result
}

/**
 * GET /api/homepage-docs/{docType} — 404·미발행 시 null (wwwDocEtc.md §4.3)
 */
export async function fetchHomepageDocPublic(docType: HomepageDocType): Promise<HomepageDocPayload | null> {
  try {
    const { data } = await api.get<unknown>(`/api/homepage-docs/${docType}`)
    return unwrapHomepageDocApi(data)
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) return null
    throw e
  }
}

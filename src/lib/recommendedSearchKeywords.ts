/**
 * 추천 검색어 — `GET /api/homepage-docs/recommended_search` (wwwDocEtc.md §8.2.1, wwwSearchPlan.md §15)
 * 시스코드·sysCodeData 경로 없음
 */
import apiClient from '@/lib/axios'
import type { HomepageDocPayload } from '@/types/homepageDoc'

function unwrapInde<T>(data: unknown): T | undefined {
  const d = data as { IndeAPIResponse?: { ErrorCode?: string; Result?: T } }
  const api = d?.IndeAPIResponse
  if (!api || api.ErrorCode !== '00' || api.Result == null) return undefined
  return api.Result as T
}

/** 관리자 저장본(쉼표·`<br />` 등) → 칩용 키워드 배열 */
export function parseRecommendedSearchBodyHtml(html: string): string[] {
  if (!html?.trim()) return []
  const text = html
    .replace(/<br\s*\/?>/gi, ',')
    .replace(/<\/p>/gi, ',')
    .replace(/<[^>]+>/g, '')
    .trim()
  const keywords = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  keywords.sort((a, b) => a.localeCompare(b))
  return keywords
}

export async function fetchRecommendedSearchKeywords(): Promise<string[]> {
  try {
    const { data } = await apiClient.get<unknown>('/api/homepage-docs/recommended_search')
    const doc = unwrapInde<HomepageDocPayload>(data)
    if (!doc?.isPublished) return []
    return parseRecommendedSearchBodyHtml(doc.bodyHtml ?? '')
  } catch {
    return []
  }
}

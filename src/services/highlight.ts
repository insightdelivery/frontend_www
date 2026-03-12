/**
 * Article Highlight API (articleHightlightPlan.md §5)
 * - 인증: JWT Bearer (getAccessToken으로 명시 첨부 + api 인터셉터)
 */
import api from '@/lib/api'
import { getAccessToken } from '@/services/auth'

const BASE = '/api/highlights'

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? getAccessToken() : undefined
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

/** 목록 조회 (articleId 필수) */
export async function fetchHighlightList(articleId: number | string): Promise<import('@/types/highlight').HighlightItem[]> {
  const id = typeof articleId === 'string' ? parseInt(articleId, 10) : articleId
  const { data } = await api.get(BASE + '/', { params: { articleId: id }, headers: authHeaders() })
  const result = unwrapResult<import('@/types/highlight').HighlightItem[]>(data)
  return Array.isArray(result) ? result : []
}

/** 단일 생성 */
export async function createHighlight(
  payload: import('@/types/highlight').HighlightCreatePayload
): Promise<{ highlightId: number }> {
  const { data } = await api.post(BASE + '/', payload, { headers: authHeaders() })
  const result = unwrapResult<{ highlightId: number }>(data)
  return result
}

/** 다문단 배치 생성 */
export async function createHighlights(
  payloads: import('@/types/highlight').HighlightCreatePayload[]
): Promise<{ highlightGroupId: number; highlightIds: number[] }> {
  const { data } = await api.post(BASE + '/', payloads, { headers: authHeaders() })
  const result = unwrapResult<{ highlightGroupId: number; highlightIds: number[] }>(data)
  return result
}

/** 단건 삭제 */
export async function deleteHighlight(highlightId: number): Promise<void> {
  await api.delete(`${BASE}/${highlightId}/`, { headers: authHeaders() })
}

/** 그룹 삭제 */
export async function deleteHighlightGroup(highlightGroupId: number): Promise<void> {
  await api.delete(`${BASE}/group/${highlightGroupId}/`, { headers: authHeaders() })
}

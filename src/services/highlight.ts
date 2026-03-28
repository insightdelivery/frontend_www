/**
 * Article Highlight API (articleHightlightPlan.md §5)
 * - 인증: JWT Bearer — lib/axios 인터셉터가 메모리 accessToken만 반영(frontend_wwwRules.md)
 */
import api from '@/lib/api'

const BASE = '/api/highlights'

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
  const { data } = await api.get(BASE, { params: { articleId: id } })
  const result = unwrapResult<import('@/types/highlight').HighlightItem[]>(data)
  return Array.isArray(result) ? result : []
}

/** 단일 생성 */
export async function createHighlight(
  payload: import('@/types/highlight').HighlightCreatePayload
): Promise<{ highlightId: number }> {
  const { data } = await api.post(BASE, payload)
  const result = unwrapResult<{ highlightId: number }>(data)
  return result
}

/** 다문단 배치 생성 */
export async function createHighlights(
  payloads: import('@/types/highlight').HighlightCreatePayload[]
): Promise<{ highlightGroupId: number; highlightIds: number[] }> {
  const { data } = await api.post(BASE, payloads)
  const result = unwrapResult<{ highlightGroupId: number; highlightIds: number[] }>(data)
  return result
}

/** 단건 삭제 */
export async function deleteHighlight(highlightId: number): Promise<void> {
  await api.delete(`${BASE}/${highlightId}`)
}

/** 그룹 삭제 */
export async function deleteHighlightGroup(highlightGroupId: number): Promise<void> {
  await api.delete(`${BASE}/group/${highlightGroupId}`)
}

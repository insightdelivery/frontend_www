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

/**
 * IndeAPIResponse.Message — 문자열이거나 DRF 검증 오류 형태(객체·객체 배열)일 수 있다.
 * Tooltip 등에 넣을 때는 반드시 문자열로 변환해야 한다(배열/객체를 그대로 렌더하면 React 런타임 오류).
 */
export function indeApiMessageToString(message: unknown): string {
  if (message == null || message === '') return '처리 중 오류가 발생했습니다.'
  if (typeof message === 'string') return message

  if (Array.isArray(message)) {
    const parts: string[] = []
    for (const item of message) {
      if (item == null) continue
      if (typeof item === 'string') {
        parts.push(item)
        continue
      }
      if (typeof item === 'object') {
        const keys = Object.keys(item as object)
        if (keys.length === 0) continue
        parts.push(indeApiMessageToString(item))
      }
    }
    const joined = parts.join(' ').trim()
    return joined || '처리 중 오류가 발생했습니다.'
  }

  if (typeof message === 'object') {
    const parts: string[] = []
    for (const v of Object.values(message as Record<string, unknown>)) {
      if (v == null) continue
      if (typeof v === 'string') parts.push(v)
      else if (Array.isArray(v)) {
        for (const x of v) {
          if (typeof x === 'string') parts.push(x)
          else if (x != null && typeof x === 'object') parts.push(indeApiMessageToString(x))
        }
      } else if (typeof v === 'object') {
        parts.push(indeApiMessageToString(v))
      }
    }
    const joined = parts.join(' ').trim()
    return joined || '처리 중 오류가 발생했습니다.'
  }

  return String(message)
}

/** 생성/삭제 실패 시 공통 API 메시지 */
export function getHighlightApiErrorMessage(err: unknown): string {
  const ax = err as { response?: { data?: { IndeAPIResponse?: { Message?: unknown } } } }
  const raw = ax.response?.data?.IndeAPIResponse?.Message
  return indeApiMessageToString(raw)
}

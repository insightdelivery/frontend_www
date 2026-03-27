/**
 * 마이페이지 하이라이트 API (wwwMypage_Highlights.md)
 */
import apiClient from '@/lib/axios'

const INDERESULT = 'IndeAPIResponse'
const RESULT = 'Result'

function unwrap<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  const wrap = d?.[INDERESULT] as Record<string, unknown> | undefined
  if (wrap && typeof wrap[RESULT] !== 'undefined') return wrap[RESULT] as T
  if (typeof d?.[RESULT] !== 'undefined') return d[RESULT] as T
  return d as T
}

function getMessage(data: unknown): string {
  const d = data as Record<string, unknown>
  const wrap = d?.[INDERESULT] as { Message?: string } | undefined
  return wrap?.Message ?? (d as { message?: string }).message ?? '처리 중 오류가 발생했습니다.'
}

export interface HighlightMypageItem {
  highlightGroupId: number
  articleId: number
  highlightText: string
  articleTitle: string
  thumbnail: string | null
  createdAt: string
}

export interface HighlightMypageGroup {
  groupKey: string
  groupType: 'date' | 'article'
  items: HighlightMypageItem[]
}

export async function getHighlightsByDate(): Promise<HighlightMypageGroup[]> {
  const res = await apiClient.get('/api/highlights/me/date')
  const out = unwrap<HighlightMypageGroup[]>(res.data)
  return Array.isArray(out) ? out : []
}

export async function getHighlightsByArticle(): Promise<HighlightMypageGroup[]> {
  const res = await apiClient.get('/api/highlights/me/article')
  const out = unwrap<HighlightMypageGroup[]>(res.data)
  return Array.isArray(out) ? out : []
}

export async function deleteHighlightGroup(highlightGroupId: number): Promise<void> {
  const res = await apiClient.delete(`/api/highlights/group/${highlightGroupId}`)
  if (res.status === 204) return
  const msg = getMessage(res.data)
  throw new Error(msg || '삭제에 실패했습니다.')
}

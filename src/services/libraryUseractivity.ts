/**
 * 라이브러리 사용자 활동 API (userPublicActiviteLog.md)
 * - 조회/별점/북마크 기록, 마이페이지 목록 조회
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

export type ContentType = 'ARTICLE' | 'VIDEO' | 'SEMINAR'

export interface ActivityLogItem {
  publicUserActivityLogId: number
  contentType: ContentType
  contentCode: string
  regDateTime: string | null
  ratingValue?: number | null
  title?: string | null
  thumbnail?: string | null
  category?: string | null
}

export interface ListResult {
  list: ActivityLogItem[]
  total: number
  page: number
  page_size: number
}

export interface RatingsListResult extends ListResult {
  summary?: {
    avgRating: number
    totalCount: number
    distribution: Record<string, number>
  }
}

/** 공유(복사) 기록 — SHARE (§8) */
export async function postShare(contentType: ContentType, contentCode: string): Promise<void> {
  const res = await apiClient.post('/api/library/useractivity/share', {
    contentType,
    contentCode,
  })
  const out = unwrap<{ result?: string }>(res.data)
  if (!out?.result) throw new Error(getMessage(res.data))
}

/** 콘텐츠 조회 기록 */
export async function postView(contentType: ContentType, contentCode: string): Promise<void> {
  const res = await apiClient.post('/api/library/useractivity/view', {
    contentType,
    contentCode,
  })
  const out = unwrap<{ result?: string }>(res.data)
  if (!out?.result) throw new Error(getMessage(res.data))
}

/** 별점 등록 */
export async function postRating(
  contentType: ContentType,
  contentCode: string,
  rating: number
): Promise<void> {
  const res = await apiClient.post('/api/library/useractivity/rating', {
    contentType,
    contentCode,
    rating,
  })
  const out = unwrap<{ result?: string }>(res.data)
  if (!out?.result) throw new Error(getMessage(res.data))
}

/** 북마크 추가 */
export async function postBookmark(contentType: ContentType, contentCode: string): Promise<void> {
  const res = await apiClient.post('/api/library/useractivity/bookmark', {
    contentType,
    contentCode,
  })
  const out = unwrap<{ result?: string }>(res.data)
  if (!out?.result) throw new Error(getMessage(res.data))
}

/** 북마크 취소 */
export async function deleteBookmark(
  contentType: ContentType,
  contentCode: string
): Promise<void> {
  const res = await apiClient.delete('/api/library/useractivity/bookmark', {
    data: { contentType, contentCode },
  })
  const out = unwrap<{ result?: string }>(res.data)
  if (!out?.result) throw new Error(getMessage(res.data))
}

/** 마이페이지 - 최근 본 콘텐츠(라이브러리) 목록 */
export async function getMeViews(params?: {
  page?: number
  page_size?: number
}): Promise<ListResult> {
  const res = await apiClient.get('/api/library/useractivity/me/views', {
    params: { page: params?.page ?? 1, page_size: params?.page_size ?? 10 },
  })
  const out = unwrap<ListResult>(res.data)
  if (!out?.list) throw new Error(getMessage(res.data))
  return out
}

/** 마이페이지 - 북마크 목록 */
export async function getMeBookmarks(params?: {
  page?: number
  page_size?: number
}): Promise<ListResult> {
  const res = await apiClient.get('/api/library/useractivity/me/bookmarks', {
    params: { page: params?.page ?? 1, page_size: params?.page_size ?? 10 },
  })
  const out = unwrap<ListResult>(res.data)
  if (!out?.list) throw new Error(getMessage(res.data))
  return out
}

/** 마이페이지 - 별점 목록 */
export async function getMeRatings(params?: {
  page?: number
  page_size?: number
  sort?: 'regDateTime_desc' | 'rating_desc' | 'rating_asc'
}): Promise<RatingsListResult> {
  const res = await apiClient.get('/api/library/useractivity/me/ratings', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 10,
      sort: params?.sort ?? 'regDateTime_desc',
    },
  })
  const out = unwrap<RatingsListResult>(res.data)
  if (!out?.list) throw new Error(getMessage(res.data))
  return out
}

import api from '@/lib/api'
import type { PublicVideoDetail, PublicVideoListResponse } from '@/types/video'

const BASE = '/api/videos'

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

export interface FetchPublicVideoListParams {
  page?: number
  pageSize?: number
  sort?: 'latest' | 'popular' | 'rating'
  /** 시스코드 SID (비어 있으면 전체) */
  category?: string
  contentType?: 'video' | 'seminar'
}

/** 공개 비디오 목록 (인증 불필요) — 메인 최신 비디오 등 */
export async function fetchPublicVideoList(
  params?: FetchPublicVideoListParams
): Promise<PublicVideoListResponse> {
  const { data } = await api.get(BASE + '/', {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      sort: params?.sort ?? 'latest',
      ...(params?.category ? { category: params.category } : {}),
      ...(params?.contentType ? { contentType: params.contentType } : {}),
    },
  })
  return unwrapResult<PublicVideoListResponse>(data)
}

/** 공개 비디오/세미나 상세 (인증 불필요) */
export async function fetchPublicVideoDetail(id: number | string): Promise<PublicVideoDetail> {
  const { data } = await api.get(`${BASE}/${id}/`)
  return unwrapResult<PublicVideoDetail>(data)
}

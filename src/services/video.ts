import api from '@/lib/api'
import type { PublicVideoListResponse } from '@/types/video'

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
  sort?: 'latest' | 'popular'
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
    },
  })
  return unwrapResult<PublicVideoListResponse>(data)
}

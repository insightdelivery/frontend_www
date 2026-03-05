import api from '@/lib/api'
import type { ArticleListResponse } from '@/types/article'

const BASE = '/api/articles'

/** IndeAPIResponse.Result unwrap */
function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

export interface FetchArticleListParams {
  page?: number
  pageSize?: number
  category?: string
  sort?: 'latest' | 'popular'
}

/** 공개 아티클 목록 조회 (인증 불필요) */
export async function fetchArticleList(
  params?: FetchArticleListParams
): Promise<ArticleListResponse> {
  const { data } = await api.get(BASE + '/', {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      category: params?.category || undefined,
      sort: params?.sort ?? 'latest',
    },
  })
  return unwrapResult<ArticleListResponse>(data)
}

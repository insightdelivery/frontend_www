import api from '@/lib/api'
import type { ArticleListResponse, ArticleDetail, ArticleListItem } from '@/types/article'

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

/** 공개 아티클 상세 조회 (인증 불필요) */
export async function fetchArticleDetail(id: number | string): Promise<ArticleDetail> {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id
  if (Number.isNaN(numId)) {
    throw new Error('유효하지 않은 아티클 ID입니다.')
  }
  const { data } = await api.get(`${BASE}/${numId}`)
  return unwrapResult<ArticleDetail>(data)
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
  const { data } = await api.get(BASE, {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      category: params?.category || undefined,
      sort: params?.sort ?? 'latest',
    },
  })
  return unwrapResult<ArticleListResponse>(data)
}

/** 상세 응답 → 목록 카드용 필드 (랭킹 contentCode 보강 시) */
export function articleDetailToListItem(d: ArticleDetail): ArticleListItem {
  return {
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    thumbnail: d.thumbnail,
    category: d.category,
    author: d.author,
    authorAffiliation: d.authorAffiliation,
    isEditorPick: d.isEditorPick ? 1 : 0,
    viewCount: d.viewCount,
    commentCount: d.commentCount,
    highlightCount: d.highlightCount,
    tags: d.tags ?? [],
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

/** rankOrder 순으로 아티클 메타 결합 — 캐시 맵 우선, 없으면 상세 API (list.md §2.4) */
export async function resolveArticlesByRanking(
  rows: { contentCode: string; rankOrder: number }[],
  byId: Map<string, ArticleListItem>
): Promise<ArticleListItem[]> {
  const sorted = [...rows].sort((a, b) => a.rankOrder - b.rankOrder)
  const out: ArticleListItem[] = []
  for (const row of sorted) {
    const code = String(row.contentCode).trim()
    if (!code) continue
    let item = byId.get(code)
    if (!item) {
      try {
        const d = await fetchArticleDetail(code)
        item = articleDetailToListItem(d)
        byId.set(code, item)
      } catch {
        continue
      }
    }
    out.push(item)
  }
  return out
}

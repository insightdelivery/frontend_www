import api from '@/lib/api'

/** IndeAPIResponse.Result unwrap (article.ts와 동일 패턴) */
function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

export interface ArticleRankingRow {
  contentCode: string
  score: number
  rankOrder: number
}

export interface ArticleRankingPayload {
  list: ArticleRankingRow[]
}

/** schedulerContentPlan / list.md §2.4 — content_ranking_cache 조회만 */
export async function fetchArticleRankingHot(): Promise<ArticleRankingPayload> {
  const { data } = await api.get('/api/library/ranking/hot')
  return unwrapResult<ArticleRankingPayload>(data)
}

export async function fetchArticleRankingShare(): Promise<ArticleRankingPayload> {
  const { data } = await api.get('/api/library/ranking/share')
  return unwrapResult<ArticleRankingPayload>(data)
}

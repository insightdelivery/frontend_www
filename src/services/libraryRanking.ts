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

/** 당일 공유 랭킹 상위 3 — list.md BEST. 아티클 기본, 비디오·세미나는 contentType 지정 */
export async function fetchArticleRankingShare(
  contentType: 'ARTICLE' | 'VIDEO' | 'SEMINAR' = 'ARTICLE',
): Promise<ArticleRankingPayload> {
  const { data } = await api.get('/api/library/ranking/share', {
    params: contentType === 'ARTICLE' ? {} : { contentType },
  })
  return unwrapResult<ArticleRankingPayload>(data)
}

/** schedulerContentPlan §D / detail.md §3.5.1 — RECOMMENDED 캐시 */
export async function fetchArticleRankingRecommended(): Promise<ArticleRankingPayload> {
  const { data } = await api.get('/api/library/ranking/recommended')
  return unwrapResult<ArticleRankingPayload>(data)
}

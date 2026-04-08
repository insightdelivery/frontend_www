/**
 * 주간 인기(WEEKLY_CROSS) — schedulerContentPlan §E / detail.md §3.5.1(2)
 */
import { fetchArticleDetail, articleDetailToListItem } from '@/services/article'
import { fetchPublicVideoDetail } from '@/services/video'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import api from '@/lib/api'

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

export interface WeeklyCrossRankingRow {
  contentType: string
  contentCode: string
  score: number
  rankOrder: number
}

export interface WeeklyCrossCardData {
  href: string
  title: string
  line2: string
  thumbSrc: string | null
  gradientIndex: number
}

export async function fetchWeeklyCrossRanking(): Promise<{ list: WeeklyCrossRankingRow[] }> {
  const { data } = await api.get('/api/library/ranking/weekly')
  return unwrapResult<{ list: WeeklyCrossRankingRow[] }>(data)
}

export async function resolveWeeklyCrossCards(rows: WeeklyCrossRankingRow[]): Promise<WeeklyCrossCardData[]> {
  const sorted = [...rows].sort((a, b) => a.rankOrder - b.rankOrder)
  const out: WeeklyCrossCardData[] = []
  let g = 0
  for (const row of sorted) {
    const code = String(row.contentCode).trim()
    if (!code) continue
    const ct = String(row.contentType).toUpperCase()
    try {
      if (ct === 'ARTICLE') {
        const d = await fetchArticleDetail(code)
        const item = articleDetailToListItem(d)
        /** 상세 하단 추천 카드와 동일 — 부제목만(에디터 이름은 표시하지 않음) */
        const line2 = (d.subtitle?.trim() || '').trim()
        out.push({
          href: `/article/detail?id=${encodeURIComponent(code)}`,
          title: d.title,
          line2,
          thumbSrc: resolveArticleThumbnailUrl(item.thumbnail),
          gradientIndex: g++,
        })
      } else if (ct === 'VIDEO' || ct === 'SEMINAR') {
        const d = await fetchPublicVideoDetail(code)
        const path = ct === 'VIDEO' ? '/video/detail' : '/seminar/detail'
        const line2 = [d.speaker, d.speakerAffiliation].filter(Boolean).join(' · ') || d.editor || ''
        out.push({
          href: `${path}?id=${encodeURIComponent(code)}`,
          title: d.title,
          line2,
          thumbSrc: resolveArticleThumbnailUrl(d.thumbnail ?? null),
          gradientIndex: g++,
        })
      }
    } catch {
      continue
    }
  }
  return out
}

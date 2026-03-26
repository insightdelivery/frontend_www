import type { ArticleListItem } from '@/types/article'
import type { ArticleCardBadge } from './ArticleCard'

/** NEW(30일 이내)·BEST(당일 공유 랭킹 상위 3 contentCode) — 순서 NEW → BEST (list.md) */
export function articleCardBadges(
  item: ArticleListItem,
  sharedTopIds: Set<string>
): ArticleCardBadge[] {
  const badges: ArticleCardBadge[] = []
  const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0
  const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation <= 30) badges.push('NEW')
  if (sharedTopIds.has(String(item.id))) badges.push('BEST')
  return badges
}

/** 공유 랭킹 API `Result.list` → id 집합 (contentCode = 아티클 PK 문자열) */
export function sharedTopIdsFromRankingList(
  list: { contentCode: string }[] | undefined | null
): Set<string> {
  const ids = new Set<string>()
  for (const row of list ?? []) {
    const c = String(row.contentCode ?? '').trim()
    if (c) ids.add(c)
  }
  return ids
}

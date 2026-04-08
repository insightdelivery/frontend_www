import type { ArticleListItem } from '@/types/article'

export type ArticleCardBadge = 'NEW' | 'BEST'

/** list.md §7 — ArticleCard와 동일 */
export const CONTENT_CARD_BADGE_STYLES: Record<ArticleCardBadge, string> = {
  NEW: 'bg-[#fde048] text-black',
  BEST: 'bg-[#ef4444] text-[#FFFFFF]',
}

/** 중복 제거, 순서 NEW → BEST (ArticleCard와 동일) */
export function normalizeContentCardBadges(badges?: ArticleCardBadge[]): ArticleCardBadge[] {
  if (!badges?.length) return []
  const out: ArticleCardBadge[] = []
  if (badges.includes('NEW')) out.push('NEW')
  if (badges.includes('BEST')) out.push('BEST')
  return out
}

/** NEW(30일 이내)·BEST(당일 공유 랭킹 상위 3 contentCode) — 순서 NEW → BEST (list.md) */
export function contentCardBadges(
  createdAt: string | undefined | null,
  id: string | number,
  sharedTopIds: Set<string>
): ArticleCardBadge[] {
  const badges: ArticleCardBadge[] = []
  const t = createdAt ? new Date(createdAt).getTime() : 0
  const daysSinceCreation = (Date.now() - t) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation <= 30) badges.push('NEW')
  if (sharedTopIds.has(String(id))) badges.push('BEST')
  return badges
}

export function articleCardBadges(
  item: ArticleListItem,
  sharedTopIds: Set<string>
): ArticleCardBadge[] {
  return contentCardBadges(item.createdAt, item.id, sharedTopIds)
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

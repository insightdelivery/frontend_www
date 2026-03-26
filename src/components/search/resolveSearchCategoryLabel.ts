import {
  ARTICLE_CATEGORY_PARENT,
  VIDEO_CATEGORY_PARENT,
  SEMINAR_CATEGORY_PARENT,
  getSysCodeFromCache,
  getSysCodeName,
} from '@/lib/syscode'
import type { SearchContentKind } from '@/types/search'

/**
 * 통합 검색 카테고리 SID → 표시명
 * - 아티클: `SYS26209B002` 하위
 * - 비디오: `SYS26325B002` 하위 (`videoPlan.md`)
 * - 세미나: `SYS26325B003` 하위 (`seminarPlan.md`)
 */
export function resolveSearchCategoryLabel(categorySid: string, kind: SearchContentKind): string {
  if (!categorySid) return ''
  const parent =
    kind === 'article'
      ? ARTICLE_CATEGORY_PARENT
      : kind === 'seminar'
        ? SEMINAR_CATEGORY_PARENT
        : VIDEO_CATEGORY_PARENT
  const list = getSysCodeFromCache(parent)
  if (list?.length) {
    const name = getSysCodeName(list, categorySid)
    if (name && name !== categorySid) return name
  }
  return categorySid
}

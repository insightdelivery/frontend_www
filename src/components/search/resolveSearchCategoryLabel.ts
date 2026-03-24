import { ARTICLE_CATEGORY_PARENT, getSysCodeFromCache, getSysCodeName } from '@/lib/syscode'

/** 비디오·세미나 카테고리도 admin과 동일하게 SYS26209B002 사용 */
export function resolveSearchCategoryLabel(categorySid: string): string {
  if (!categorySid) return ''
  const list = getSysCodeFromCache(ARTICLE_CATEGORY_PARENT)
  if (list?.length) {
    const name = getSysCodeName(list, categorySid)
    if (name && name !== categorySid) return name
  }
  return categorySid
}

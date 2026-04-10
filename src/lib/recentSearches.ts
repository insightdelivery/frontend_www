/**
 * 헤더 검색바 — 최근 검색어 (wwwSearchPlan.md §5.3)
 * - localStorage key `recent_searches`, 최대 5건, 최신순, 중복 시 제거 후 맨 앞 추가
 */

export const RECENT_SEARCHES_STORAGE_KEY = 'recent_searches'

export const RECENT_SEARCHES_MAX = 5

export function saveRecentSearch(keyword: string): void {
  if (typeof window === 'undefined') return
  const trimmed = keyword.trim()
  if (!trimmed) return
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY)
    let list: string[] = stored ? (JSON.parse(stored) as string[]) : []
    if (!Array.isArray(list)) list = []
    list = list.filter((item) => item !== trimmed)
    list.unshift(trimmed)
    if (list.length > RECENT_SEARCHES_MAX) {
      list = list.slice(0, RECENT_SEARCHES_MAX)
    }
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* private mode·JSON 오류 */
  }
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY)
    if (!stored) return []
    const list = JSON.parse(stored) as string[]
    return Array.isArray(list) ? list.filter((s) => typeof s === 'string' && s.trim() !== '') : []
  } catch {
    return []
  }
}

export function removeRecentSearch(keyword: string): string[] {
  if (typeof window === 'undefined') return []
  const list = getRecentSearches().filter((item) => item !== keyword)
  try {
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* 저장 실패 시에도 UI는 갱신된 목록 반환 */
  }
  return list
}

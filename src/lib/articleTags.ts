/**
 * 아티클 `tags` — API가 콤마 구분 문자열 또는 문자열 배열로 줄 수 있음 → 표시용 배열로 통일.
 */
export function normalizeArticleTags(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw
      .map((t) => (typeof t === 'string' ? t.trim() : String(t).trim()))
      .filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

/** 화면 표시용: 선행 `#` 제거 후 항상 `#` 한 번만 붙임. 내용 없으면 빈 문자열 */
export function formatArticleTagLabel(tag: string): string {
  const t = tag.trim()
  const body = (t.startsWith('#') ? t.slice(1) : t).trim()
  return body ? `#${body}` : ''
}

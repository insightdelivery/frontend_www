/**
 * 공유 short 링크 — 정적 export 표준 `/s?code=` (contentShareLinkCopy.md §5·§6)
 */
export function buildShortSharePageUrl(shortCode: string): string {
  if (typeof window === 'undefined') return ''
  const q = new URLSearchParams({ code: shortCode.trim() })
  return `${window.location.origin}/s?${q.toString()}`
}

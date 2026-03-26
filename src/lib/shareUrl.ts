/**
 * 공유 short 링크 — 정적 export 표준 `/s?code=` (contentShareLinkCopy.md §5·§6)
 * `/s/{code}` 경로는 output: export에서 middleware를 쓸 수 없으므로, 필요 시 CDN에서 `/s?code=`로 리다이렉트.
 */
export function buildShortSharePageUrl(shortCode: string): string {
  if (typeof window === 'undefined') return ''
  const q = new URLSearchParams({ code: shortCode.trim() })
  return `${window.location.origin}/s?${q.toString()}`
}

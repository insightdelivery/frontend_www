/** OG·메타용 — HTML에서 태그 제거 후 길이 제한 */
export function plainTextExcerptFromHtml(html: string | null | undefined, maxLen: number): string {
  if (!html?.trim()) return ''
  const text = String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen - 1).trimEnd()}…`
}

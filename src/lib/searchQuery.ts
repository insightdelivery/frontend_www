/** wwwSearchSuccessPlan 7.1 — trim + 연속 공백 축약 */
export function normalizeSearchQuery(raw: string | null | undefined): string {
  return (raw ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

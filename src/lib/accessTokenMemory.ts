/**
 * frontend_wwwRules.md §2 — accessToken은 프론트 메모리에서만 관리 (쿠키·HttpOnly 참조 금지).
 */

let memoryAccessToken: string | null = null

export function getMemoryAccessToken(): string {
  return (memoryAccessToken ?? '').trim()
}

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token && token.trim() ? token.trim() : null
}

export function clearMemoryAccessToken(): void {
  memoryAccessToken = null
}

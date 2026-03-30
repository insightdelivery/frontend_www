/**
 * frontend_wwwRules.md §2 — accessToken은 프론트 메모리가 단일 출처 (쿠키·HttpOnly 참조 금지).
 * 새로고침 직후 동일 탭에서 메모리를 복구하기 위해 sessionStorage에만 거울을 둔다(탭 종료 시 삭제).
 * refreshToken은 계속 HttpOnly만 사용.
 */
const SESSION_ACCESS_KEY = '__inde_www_access_jwt'

let memoryAccessToken: string | null = null

function hydrateFromSessionStorage(): void {
  if (typeof window === 'undefined' || memoryAccessToken) return
  try {
    const s = sessionStorage.getItem(SESSION_ACCESS_KEY)?.trim()
    if (s) memoryAccessToken = s
  } catch {
    /* 사파리 프라이빗 모드 등 */
  }
}

export function getMemoryAccessToken(): string {
  hydrateFromSessionStorage()
  return (memoryAccessToken ?? '').trim()
}

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token && token.trim() ? token.trim() : null
  if (typeof window === 'undefined') return
  try {
    if (memoryAccessToken) {
      sessionStorage.setItem(SESSION_ACCESS_KEY, memoryAccessToken)
    } else {
      sessionStorage.removeItem(SESSION_ACCESS_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function clearMemoryAccessToken(): void {
  memoryAccessToken = null
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_ACCESS_KEY)
  } catch {
    /* ignore */
  }
}

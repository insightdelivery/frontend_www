/**
 * 로그인 완료 후 이동 경로 — open redirect 방지(동일 출처 상대 경로만).
 * OAuth는 백엔드가 `next`를 쿼리로 넘기지 않으므로 sessionStorage(`POST_LOGIN_NEXT_SESSION_KEY`)로 보조.
 */

const MAX_LEN = 2048

export const POST_LOGIN_NEXT_SESSION_KEY = 'inde_post_login_next'

export function getSafePostLoginRedirect(next: string | null | undefined): string {
  if (next == null || typeof next !== 'string') return '/'
  const t = next.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return '/'
  if (/[\s\r\n]/.test(t)) return '/'
  if (t.includes('://')) return '/'
  if (t.length > MAX_LEN) return '/'
  if (t === '/login' || t.startsWith('/login?')) return '/'
  return t
}

/** pathname + 쿼리스트링(선택, `?` 없이) */
export function buildLoginHrefFromParts(pathname: string, searchWithoutQuestionMark: string | null | undefined): string {
  const q = searchWithoutQuestionMark && searchWithoutQuestionMark.length > 0 ? `?${searchWithoutQuestionMark}` : ''
  const full = `${pathname}${q}`
  if (pathname === '/login' || pathname === '/register') return '/login'
  return `/login?next=${encodeURIComponent(full)}`
}

/**
 * SNS 로그인 직전 호출. `next`가 없거나 `/`면 기존 저장값을 지워
 * (이전 방문에서 남은 경로로 잘못 복귀하는 것 방지).
 */
export function persistPostLoginNextForOAuth(nextFromQuery: string | null): void {
  const safe = nextFromQuery ? getSafePostLoginRedirect(nextFromQuery) : null
  if (!safe || safe === '/') {
    try {
      sessionStorage.removeItem(POST_LOGIN_NEXT_SESSION_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  try {
    sessionStorage.setItem(POST_LOGIN_NEXT_SESSION_KEY, safe)
  } catch {
    /* private mode 등 */
  }
}

export function consumePostLoginNextFromSession(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = sessionStorage.getItem(POST_LOGIN_NEXT_SESSION_KEY)
    sessionStorage.removeItem(POST_LOGIN_NEXT_SESSION_KEY)
    return v
  } catch {
    return null
  }
}

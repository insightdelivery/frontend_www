/**
 * GA4 — `googleAnalyticsPlan.md` (send_page_view: false, page_view는 event만)
 */

let _lastPageView: { href: string; t: number } | null = null
const PAGE_VIEW_DEDUPE_MS = 450

export function getGaMeasurementId(): string {
  return (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim()
}

export function isGaConfigured(): boolean {
  const id = getGaMeasurementId()
  return id.length > 0 && id.startsWith('G-')
}

/** 후행 슬래시 제거(urlNoTrailingSlashPolicy.md). 루트는 `/` 유지 */
function buildPagePathFromLocation(): string {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path + (window.location.search || '')
}

export function gaSendPageView(): void {
  if (!isGaConfigured() || typeof window === 'undefined' || typeof window.gtag !== 'function') return

  const href = window.location.href
  const now = Date.now()
  if (_lastPageView && _lastPageView.href === href && now - _lastPageView.t < PAGE_VIEW_DEDUPE_MS) {
    return
  }
  _lastPageView = { href, t: now }

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: href,
    page_path: buildPagePathFromLocation(),
  })
}

/** 맞춤 이벤트(플랜 §8) — gtag 미로드 시 무시 */
export function gaSendEvent(name: string, params?: Record<string, unknown>): void {
  if (!isGaConfigured() || typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params ?? {})
}

/** GNB 등에서 로그인 화면으로 이동할 때 (`login_click`) */
export function gaTrackLoginNavClick(linkLocation: 'gnb_desktop' | 'gnb_mobile'): void {
  gaSendEvent('login_click', { link_location: linkLocation })
}

/** 로그인 페이지에서 소셜 OAuth로 나가기 직전 (`login_click` + method) */
export function gaTrackSocialLoginStart(provider: 'kakao' | 'naver' | 'google'): void {
  gaSendEvent('login_click', { link_location: 'login_page', method: provider })
}

/** 로그인 성공 — GA4 권장 `login` 이벤트(`method`: email | kakao | naver | google) */
export function gaTrackLoginSuccess(method: string): void {
  gaSendEvent('login', { method })
}

/** `getMe()` 등의 `joined_via` → GA `login.method` */
export function gaLoginMethodFromJoinedVia(
  joined: 'LOCAL' | 'KAKAO' | 'NAVER' | 'GOOGLE' | string | undefined | null,
): string {
  const u = String(joined || '').toUpperCase()
  if (u === 'LOCAL') return 'email'
  if (u === 'KAKAO') return 'kakao'
  if (u === 'NAVER') return 'naver'
  if (u === 'GOOGLE') return 'google'
  return 'unknown'
}

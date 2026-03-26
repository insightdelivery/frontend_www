import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * `/s/{shortCode}` → `/s?code=` (정적 export는 동적 [slug] 페이지와 호환되지 않음)
 * next dev / Node 서버에서만 실행. 순수 정적 호스팅은 CDN에서 동일 리다이렉트 또는 `/s?code=` 링크만 사용.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const m = pathname.match(/^\/s\/([^/]+)\/?$/)
  if (!m?.[1]) {
    return NextResponse.next()
  }
  const url = request.nextUrl.clone()
  url.pathname = '/s'
  url.searchParams.set('code', m[1])
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/s/(.*)'],
}

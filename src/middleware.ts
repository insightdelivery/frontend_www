import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * wwwMypagePlan §10.2 — 서버에서 읽을 수 있는 세션 힌트만 1차 판단.
 * frontend_wwwRules.md: accessToken은 메모리만 → 미들웨어에 없음.
 * refreshToken(HttpOnly)·userInfo(표시용) 중 하나라도 있으면 통과 후 클라이언트·API가 최종 판단.
 */
export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value
  const userInfo = request.cookies.get('userInfo')?.value

  if (request.nextUrl.pathname.startsWith('/mypage')) {
    if (!refreshToken && !userInfo) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/mypage/:path*'],
}

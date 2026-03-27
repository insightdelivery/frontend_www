import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * wwwMypagePlan §10.2 — 쿠키 존재 여부만 1차 판단. 만료·유효성은 axios·API에서 처리.
 */
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value

  if (request.nextUrl.pathname.startsWith('/mypage')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/mypage/:path*'],
}

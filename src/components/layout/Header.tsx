'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { isAuthenticated, getMe, logout } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Search, Menu, X, Home } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [validating, setValidating] = useState(true) // 초기: 토큰 유효성 검사 전
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 토큰이 있으면 서버에 유효성 검사(getMe), 없으면 비인증 처리
  useEffect(() => {
    if (pathname.startsWith('/auth/callback')) return

    const run = async () => {
      if (!isAuthenticated()) {
        setAuthenticated(false)
        setUserName(null)
        setValidating(false)
        return
      }

      // 쿠키에 토큰이 있으면 반드시 서버로 유효성 검사 (만료/무효 토큰 구분)
      setValidating(true)
      try {
        const user = await getMe()
        setUserName(user?.name || null)
        setAuthenticated(true)
      } catch {
        setAuthenticated(false)
        setUserName(null)
        // 401 시 axios 인터셉터에서 쿠키 삭제 후 /login 리다이렉트
      } finally {
        setValidating(false)
      }
    }

    run()
  }, [pathname])

  // 다른 탭/요청에서 쿠키가 삭제된 경우 동기화 (토큰 유효성은 getMe로만 판단, 여기서는 삭제 감지)
  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated && !Cookies.get('accessToken')) {
        setAuthenticated(false)
        setUserName(null)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [authenticated])

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  // OAuth 콜백 등 내부 처리 페이지에서만 헤더 숨김 (로그인/회원가입은 헤더·푸터 표시)
  if (pathname.startsWith('/auth/callback')) {
    return null
  }

  const isArticleSection = pathname === '/article' || pathname.startsWith('/article/')
  const isMainPage = pathname === '/' // HOME 링크 표시 여부만 사용 (스타일은 메인 구분 없이 동일)

  return (
    <header className="sticky top-0 z-50 bg-neon-yellow text-black">
      <div className="mx-auto max-w-[1220px] px-4 md:px-8">
        <div className="flex items-center h-[52px] sm:h-[56px]">
          {/* Desktop Navigation - Left */}
          <nav className="hidden lg:flex flex-1 items-center gap-10 text-[14px] font-bold">
            {!isMainPage && (
              <Link
                href="/"
                className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
                aria-label="메인으로"
              >
                <Home className="h-[18px] w-[18px]" />
              </Link>
            )}
            <Link
              href="/article"
              className={`hover:opacity-70 transition-opacity ${isArticleSection ? 'underline underline-offset-4' : ''}`}
            >
              아티클
            </Link>
            <Link
              href="/video"
              className={`hover:opacity-70 transition-opacity ${pathname === '/video' ? 'underline underline-offset-4' : ''}`}
            >
              비디오
            </Link>
            <Link
              href="/seminar"
              className={`hover:opacity-70 transition-opacity ${pathname === '/seminar' ? 'underline underline-offset-4' : ''}`}
            >
              세미나
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md hover:bg-black/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Logo - 중앙 (고정 크기) */}
          <div className="flex-1 flex justify-center items-center min-w-0">
            <Link
              href="/"
              className="flex items-center select-none"
            >
              <Image
                src="/inde_logo.png"
                alt="InDe"
                width={88}
                height={36}
                className="h-9 w-[88px] object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Actions - Right */}
          <div className="hidden lg:flex flex-1 items-center justify-end gap-6 text-[14px] font-bold">
            {validating ? (
              <span className="text-[13px] text-gray-500">확인 중...</span>
            ) : authenticated ? (
              <>
                {userName && (
                  <span className="text-[13px] font-medium">
                    {userName}님
                  </span>
                )}
                <Link
                  href="/mypage"
                  className="hover:opacity-70 transition-opacity"
                >
                  마이페이지
                </Link>
                <button
                  type="button"
                  className="hover:opacity-70 transition-opacity"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="hover:opacity-70 transition-opacity"
                  onClick={() => router.push('/login')}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className="hover:opacity-70 transition-opacity"
                  onClick={() => router.push('/register')}
                >
                  회원가입
                </button>
              </>
            )}

            <button
              type="button"
              className="rounded-md hover:bg-black/10 transition-colors p-1.5"
              aria-label="검색"
            >
              <Search className="h-[16px] w-[16px]" />
            </button>
          </div>

          {/* Mobile Actions - Right */}
          <div className="lg:hidden flex items-center gap-4">
            <button
              type="button"
              className="rounded-md hover:bg-black/10 transition-colors p-1.5"
              aria-label="검색"
            >
              <Search className="h-[16px] w-[16px]" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-black/10 bg-neon-yellow">
            <nav className="flex flex-col py-4 px-4 space-y-4 text-[15px] font-bold">
              {!isMainPage && (
                <Link
                  href="/"
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5 flex-shrink-0" />
                  HOME (메인)
                </Link>
              )}
              <Link
                href="/article"
                className={`hover:opacity-70 transition-opacity ${isArticleSection ? 'underline underline-offset-4' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                아티클
              </Link>
              <Link
                href="/video"
                className={`hover:opacity-70 transition-opacity ${pathname === '/video' ? 'underline underline-offset-4' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                비디오
              </Link>
              <Link
                href="/seminar"
                className={`hover:opacity-70 transition-opacity ${pathname === '/seminar' ? 'underline underline-offset-4' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                세미나
              </Link>
              <div className="pt-4 border-t border-black/10 space-y-3">
                {validating ? (
                  <p className="text-[14px] text-gray-500">확인 중...</p>
                ) : authenticated ? (
                  <>
                    {userName && (
                      <p className="text-[14px] font-medium text-gray-700">
                        {userName}님
                      </p>
                    )}
                    <Link
                      href="/mypage"
                      className="block w-full text-left text-[14px] font-bold hover:opacity-70 transition-opacity"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <button
                      type="button"
                      className="block w-full text-left text-[14px] font-bold hover:opacity-70 transition-opacity"
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="block w-full text-left text-[14px] font-bold hover:opacity-70 transition-opacity"
                      onClick={() => {
                        router.push('/login')
                        setMobileMenuOpen(false)
                      }}
                    >
                      로그인
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left text-[14px] font-bold hover:opacity-70 transition-opacity"
                      onClick={() => {
                        router.push('/register')
                        setMobileMenuOpen(false)
                      }}
                    >
                      회원가입
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}





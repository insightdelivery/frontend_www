'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated, getUserInfo, logout } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Search, Menu, X, Home } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const auth = isAuthenticated()
      setAuthenticated(auth)
      
      if (auth) {
        const user = getUserInfo()
        setUserName(user?.name || null)
      }
    }

    checkAuth()
    
    // 주기적으로 인증 상태 확인 (쿠키 변경 감지)
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  // OAuth 콜백 등 내부 처리 페이지에서만 헤더 숨김 (로그인/회원가입은 헤더·푸터 표시)
  if (pathname.startsWith('/auth/callback')) {
    return null
  }

  // Figma 1-1044: 메인(/)이 아닌 모든 페이지 = 로고 없음, 메뉴 글씨 작게
  const isMainPage = pathname === '/'
  const isArticleSection = pathname === '/article' || pathname.startsWith('/article/')

  return (
    <header className="sticky top-0 z-50 bg-neon-yellow text-black">
      <div className="mx-auto max-w-[1220px] px-4 md:px-8">
        <div className={`flex items-center ${isMainPage ? 'h-[90px]' : 'h-[52px] sm:h-[56px]'}`}>
          {/* Desktop Navigation - Left */}
          <nav
            className={`hidden lg:flex flex-1 items-center gap-10 ${isMainPage ? 'text-[25px] font-[800]' : 'text-[14px] font-bold'}`}
          >
            {/* 메인이 아닐 때만 HOME 아이콘 (메인으로 이동) */}
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

          {/* Mobile Menu Button - 서브 페이지에서는 작은 툴바에 맞춤 */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md hover:bg-black/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴"
          >
            {mobileMenuOpen ? (
              <X className={isMainPage ? 'h-6 w-6' : 'h-5 w-5'} />
            ) : (
              <Menu className={isMainPage ? 'h-6 w-6' : 'h-5 w-5'} />
            )}
          </button>

          {/* Logo - 메인 페이지에서만 표시 (Figma 1-1044: 그 외 페이지는 로고 없음) */}
          {isMainPage && (
            <Link
              href="/"
              className="flex items-center select-none mx-auto lg:mx-0"
            >
              <Image
                src="/inde_logo.png"
                alt="InDe"
                width={150}
                height={60}
                className="h-30 w-140"
                priority
              />
            </Link>
          )}

          {/* Desktop Actions - Right */}
          <div
            className={`hidden lg:flex flex-1 items-center justify-end gap-6 ${!isMainPage ? 'text-[14px] font-bold' : ''}`}
          >
            {authenticated ? (
              <>
                {userName && (
                  <span className={isMainPage ? 'text-[14px] font-medium' : 'text-[13px] font-medium'}>
                    {userName}님
                  </span>
                )}
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
              className={`rounded-md hover:bg-black/10 transition-colors ${!isMainPage ? 'p-1.5' : 'p-2'}`}
              aria-label="검색"
            >
              <Search className={isMainPage ? 'h-[18px] w-[18px]' : 'h-[16px] w-[16px]'} />
            </button>
          </div>

          {/* Mobile: 서브 페이지에서 로고 영역 비움 */}
          {!isMainPage && (
            <div className="flex-1 lg:hidden" aria-hidden />
          )}

          {/* Mobile Actions - Right */}
          <div className="lg:hidden flex items-center gap-4">
            <button
              type="button"
              className="rounded-md hover:bg-black/10 transition-colors p-1.5"
              aria-label="검색"
            >
              <Search className={isMainPage ? 'h-[18px] w-[18px]' : 'h-[16px] w-[16px]'} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-black/10 bg-neon-yellow">
            <nav className={`flex flex-col py-4 px-4 space-y-4 ${!isMainPage ? 'text-[15px] font-bold' : 'text-[25px] font-[800]'}`}>
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
                {authenticated ? (
                  <>
                    {userName && (
                      <p className="text-[14px] font-medium text-gray-700">
                        {userName}님
                      </p>
                    )}
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





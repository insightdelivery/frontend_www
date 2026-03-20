'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Menu, X, Home } from 'lucide-react'
import MainBar from '@/components/layout/MainBar'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { status, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  /** GNB 인사말: 닉네임 우선, 없으면 이름(레거시·데이터 누락 대비) */
  const greetLabel = (user?.nickname?.trim() || user?.name?.trim() || null)

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  if (pathname.startsWith('/auth/callback')) {
    return null
  }

  if (status === 'loading') {
    return (
      <div className="sticky top-0 z-50">
        <MainBar />
        <div className="gnb-placeholder h-[60px] bg-neon-yellow" aria-hidden />
      </div>
    )
  }

  const isArticleSection = pathname === '/article' || pathname.startsWith('/article/')
  const isMainPage = pathname === '/' // HOME 링크 표시 여부만 사용 (스타일은 메인 구분 없이 동일)

  return (
    <div className="sticky top-0 z-50">
      <MainBar />
      <header className="bg-neon-yellow text-black">
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
            {status === 'authenticated' ? (
              <>
                {greetLabel && (
                  <span className="text-[13px] font-medium">
                    {greetLabel}님
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
                {status === 'authenticated' ? (
                  <>
                    {greetLabel && (
                      <p className="text-[14px] font-medium text-gray-700">
                        {greetLabel}님
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
    </div>
  )
}





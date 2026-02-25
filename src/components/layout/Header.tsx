'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated, getUserInfo, logout } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Search, Menu, X } from 'lucide-react'

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

  // 로그인/회원가입 페이지에서는 헤더 숨김
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/auth/callback')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 bg-neon-yellow text-black">
      <div className="mx-auto max-w-[1220px] px-4 md:px-8">
        <div className="h-[90px] flex items-center">
          {/* Desktop Navigation - Left */}
          <nav className="hidden lg:flex flex-1 items-center gap-10 text-[25px] font-[800]">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              아티클
            </Link>
            <Link href="/" className="hover:opacity-70 transition-opacity">
              비디오
            </Link>
            <Link href="/" className="hover:opacity-70 transition-opacity">
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
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo - Center */}
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

          {/* Desktop Actions - Right */}
          <div className="hidden lg:flex flex-1 items-center justify-end gap-6">
            {authenticated ? (
              <>
                {userName && (
                  <span className="text-[14px] font-medium">
                    {userName}님
                  </span>
                )}
                <button
                  type="button"
                  className="text-[14px] font-bold hover:opacity-70 transition-opacity"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="text-[14px] font-bold hover:opacity-70 transition-opacity"
                  onClick={() => router.push('/login')}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className="text-[14px] font-bold hover:opacity-70 transition-opacity"
                  onClick={() => router.push('/register')}
                >
                  회원가입
                </button>
              </>
            )}

            <button
              type="button"
              className="p-2 rounded-md hover:bg-black/10 transition-colors"
              aria-label="검색"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Mobile Actions - Right */}
          <div className="lg:hidden flex items-center gap-4">
            <button
              type="button"
              className="p-2 rounded-md hover:bg-black/10 transition-colors"
              aria-label="검색"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-black/10 bg-neon-yellow">
            <nav className="flex flex-col py-4 px-4 space-y-4">
              <Link
                href="/"
                className="text-[25px] font-[800] hover:opacity-70 transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              >
                아티클
              </Link>
              <Link
                href="/"
                className="text-[25px] font-[800] hover:opacity-70 transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              >
                비디오
              </Link>
              <Link
                href="/"
                className="text-[25px] font-[800] hover:opacity-70 transition-opacity"
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





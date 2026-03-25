'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Menu, X, Home } from 'lucide-react'
import MainBar from '@/components/layout/MainBar'
import HeaderSearch from '@/components/layout/HeaderSearch'
import { normalizeSearchQuery } from '@/lib/searchQuery'
import { fetchNotices } from '@/services/board'
import type { NoticeListItem } from '@/types/board'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { status, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [gnbNotice, setGnbNotice] = useState<NoticeListItem | null>(null)
  const gnbFetchedRef = useRef(false)

  const closeSearch = useCallback(() => setIsSearchOpen(false), [])
  const greetLabel = user?.nickname?.trim() || user?.name?.trim() || null

  useEffect(() => {
    if (gnbFetchedRef.current) return
    gnbFetchedRef.current = true
    fetchNotices({ page: 1, page_size: 20, show_in_gnb: true })
      .then((res) => {
        const list = Array.isArray(res.results) ? res.results : []
        const filtered = list.filter((row) => row.show_in_gnb === true)
        setGnbNotice(filtered[0] ?? null)
      })
      .catch(() => setGnbNotice(null))
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  const handleSearchSubmit = (raw: string) => {
    const q = normalizeSearchQuery(raw)
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    closeSearch()
  }

  if (status === 'loading') {
    return (
      <div className="sticky top-0 z-50">
        <MainBar notice={null} />
        <div className="h-[52px] bg-neon-yellow" aria-hidden />
      </div>
    )
  }

  const isArticleSection = pathname === '/article' || pathname.startsWith('/article/')
  const isVideoSection = pathname.startsWith('/video')
  const isSeminarSection = pathname.startsWith('/seminar')
  const isMainPage = pathname === '/'

  return (
    <div className="sticky top-0 z-50">
      <MainBar notice={gnbNotice} />
      <header className="relative bg-neon-yellow text-black">
        {mobileMenuOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/50 lg:hidden"
            aria-label="메뉴 닫기"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div className="relative z-[101] mx-auto max-w-[1220px] px-4 md:px-8">
          <div className="flex h-[52px] items-center">
            <nav className="hidden flex-1 items-center gap-10 text-[14px] font-bold lg:flex">
              {!isMainPage && (
                <Link
                  href="/"
                  className="rounded-md p-1.5 transition-colors hover:bg-black/10"
                  aria-label="메인으로"
                >
                  <Home className="h-[18px] w-[18px]" />
                </Link>
              )}
              <Link
                href="/article"
                className={`transition-opacity hover:opacity-70 ${isArticleSection ? 'underline underline-offset-4' : ''}`}
              >
                아티클
              </Link>
              <Link
                href="/video"
                className={`transition-opacity hover:opacity-70 ${isVideoSection ? 'underline underline-offset-4' : ''}`}
              >
                비디오
              </Link>
              <Link
                href="/seminar"
                className={`transition-opacity hover:opacity-70 ${isSeminarSection ? 'underline underline-offset-4' : ''}`}
              >
                세미나
              </Link>
            </nav>

            <button
              type="button"
              className="rounded-md p-2 transition-colors hover:bg-black/10 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="메뉴"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center">
              <Link href="/" className="flex select-none items-center">
                <Image
                  src="/inde_logo.png"
                  alt="InDe"
                  width={73}
                  height={26}
                  className="h-9 object-contain"
                  priority
                />
              </Link>
            </div>

            <div className="hidden flex-1 items-center justify-end gap-6 text-[14px] font-bold lg:flex">
              {status === 'authenticated' ? (
                <>
                  {greetLabel && <span className="text-[13px] font-medium">{greetLabel}님</span>}
                  <Link href="/mypage" className="transition-opacity hover:opacity-70">
                    마이페이지
                  </Link>
                  <button type="button" className="transition-opacity hover:opacity-70" onClick={handleLogout}>
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="transition-opacity hover:opacity-70" onClick={() => router.push('/login')}>
                    로그인
                  </button>
                  <button type="button" className="transition-opacity hover:opacity-70" onClick={() => router.push('/register')}>
                    회원가입
                  </button>
                </>
              )}
              <button
                type="button"
                className="rounded-md p-1.5 transition-colors hover:bg-black/10"
                aria-label="검색"
                aria-expanded={isSearchOpen}
                aria-controls="header-search-panel"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setMobileMenuOpen(false)
                  setIsSearchOpen((o) => !o)
                }}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 lg:hidden">
              <button
                type="button"
                className="rounded-md p-1.5 transition-colors hover:bg-black/10"
                aria-label="검색"
                aria-expanded={isSearchOpen}
                aria-controls="header-search-panel"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setMobileMenuOpen(false)
                  setIsSearchOpen((o) => !o)
                }}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-black/10 bg-neon-yellow lg:hidden">
              <nav className="flex flex-col space-y-4 px-4 py-4 text-[15px] font-bold">
                {!isMainPage && (
                  <Link
                    href="/"
                    className="flex items-center gap-2 transition-opacity hover:opacity-70"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-5 w-5 shrink-0" />
                    HOME (메인)
                  </Link>
                )}
                <Link
                  href="/article"
                  className={`transition-opacity hover:opacity-70 ${isArticleSection ? 'underline underline-offset-4' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  아티클
                </Link>
                <Link
                  href="/video"
                  className={`transition-opacity hover:opacity-70 ${isVideoSection ? 'underline underline-offset-4' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  비디오
                </Link>
                <Link
                  href="/seminar"
                  className={`transition-opacity hover:opacity-70 ${isSeminarSection ? 'underline underline-offset-4' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  세미나
                </Link>
                <div className="space-y-3 border-t border-black/10 pt-4">
                  {status === 'authenticated' ? (
                    <>
                      {greetLabel && <p className="text-[14px] font-medium text-gray-700">{greetLabel}님</p>}
                      <Link
                        href="/mypage"
                        className="block w-full text-left text-[14px] font-bold transition-opacity hover:opacity-70"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        마이페이지
                      </Link>
                      <button
                        type="button"
                        className="block w-full text-left text-[14px] font-bold transition-opacity hover:opacity-70"
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
                        className="block w-full text-left text-[14px] font-bold transition-opacity hover:opacity-70"
                        onClick={() => {
                          router.push('/login')
                          setMobileMenuOpen(false)
                        }}
                      >
                        로그인
                      </button>
                      <button
                        type="button"
                        className="block w-full text-left text-[14px] font-bold transition-opacity hover:opacity-70"
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

      <HeaderSearch isOpen={isSearchOpen} onClose={closeSearch} onSearch={handleSearchSubmit} />
    </div>
  )
}

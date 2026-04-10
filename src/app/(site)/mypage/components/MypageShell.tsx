'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { buildLoginHrefFromParts } from '@/lib/postLoginRedirect'
import { MYPAGE_TABS } from './MypageTabs'
import MypageScrollTabs from './MypageScrollTabs'
import { isMypageTabActive } from './mypageNavUtils'
import { ChevronRight } from 'lucide-react'

export default function MypageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useAuth()

  /** `output: 'export'` 정적 빌드에서는 middleware 사용 불가 → 서버 리다이렉트 대신 클라이언트 가드 */
  useEffect(() => {
    if (status !== 'unauthenticated') return
    if (typeof window === 'undefined') return
    const q = window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search
    router.replace(buildLoginHrefFromParts(window.location.pathname, q))
  }, [status, router])

  const currentTab =
    MYPAGE_TABS.find((tab) => isMypageTabActive(pathname, tab.path)) ?? MYPAGE_TABS[0]

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[14px] text-[#6b7280]">
        세션 확인 중…
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[14px] text-[#6b7280]">
        로그인 페이지로 이동합니다…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[900px] px-6 md:px-8">
        {/* Breadcrumb */}
        <div className="flex flex-col gap-2 pt-10">
          <div className="flex items-center gap-2">
            <span className="text-[14px] leading-5 text-[#6b7280]">마이페이지</span>
            <ChevronRight className="h-[6px] w-[6px] shrink-0 text-[#6b7280]" aria-hidden />
            <span className="text-[14px] leading-5 text-[#6b7280]">{currentTab.title}</span>
          </div>
          <h1 className="text-[30px] font-bold leading-9 text-[#111827]">{currentTab.title}</h1>
          <p className="text-[16px] leading-6 text-[#6b7280]">{currentTab.subtitle}</p>
        </div>

        {/* Tab bar: 가로 스크롤 + 화살표 + 활성 탭 중앙 정렬 (mypage.md — 모바일 탭 명령서) */}
        <nav className="mt-6 border-b border-[#e5e7eb]" aria-label="마이페이지 탭">
          <MypageScrollTabs />
        </nav>

        {/* Main content: padding top 40px, bottom 44px */}
        <main className="pb-11 pt-10">{children}</main>
      </div>
    </div>
  )
}

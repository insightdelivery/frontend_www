'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MYPAGE_TABS } from './MypageTabs'
import { ChevronRight } from 'lucide-react'

/** 현재 pathname에 해당하는 탭이 활성인지 (회원정보는 /mypage, /mypage/info 모두 활성, 1:1 문의는 /mypage/support 하위 전부) */
function isTabActive(pathname: string | null, tabPath: string): boolean {
  const p = (pathname ?? '').replace(/\/$/, '')
  if (p === tabPath) return true
  if (tabPath === '/mypage/info' && (p === '/mypage' || p === '/mypage/info')) return true
  if (tabPath === '/mypage/support' && p.startsWith('/mypage/support')) return true
  return false
}

export default function MypageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentTab =
    MYPAGE_TABS.find((tab) => isTabActive(pathname, tab.path)) ?? MYPAGE_TABS[0]

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

        {/* Tab bar: 선택 탭 검은색 볼드 + 밑줄 #E1F800 (Figma 88-1265, mypage.md §1.2) */}
        <nav className="mt-6 border-b border-[#e5e7eb]" aria-label="마이페이지 탭">
          <div className="flex gap-8">
            {MYPAGE_TABS.map((tab) => {
              const active = isTabActive(pathname, tab.path)
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className="inline-block pb-[18px] text-[16px] leading-6 border-b-2 -mb-px transition-colors border-transparent hover:text-[#111827]"
                  style={{
                    borderBottomColor: active ? '#E1F800' : 'transparent',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#000000' : '#9ca3af',
                  }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Main content: padding top 40px, bottom 44px */}
        <main className="pb-11 pt-10">{children}</main>
      </div>
    </div>
  )
}

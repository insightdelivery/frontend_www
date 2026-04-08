import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense
        fallback={
          <div className="sticky top-0 z-50">
            <div className="h-[52px] bg-neon-yellow" aria-hidden />
          </div>
        }
      >
        <Header />
      </Suspense>
      {/*
        본문 오프셋: Header가 sticky이지만 일반 flow에서 이미 84px(MainBar+Toolbar)를 차지하므로
        여기에 padding-top을 또 주면 이중 여백(약 168px)이 된다 — 제거.
        --header-height는 앵커·scroll-margin 등 다른 용도로 globals.css에 유지.
      */}
      {children}
      <Footer />
    </>
  )
}

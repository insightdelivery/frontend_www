'use client'

import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
import HomeLatestArticles from '@/components/home/HomeLatestArticles'
import HomeLatestVideos from '@/components/home/HomeLatestVideos'
import { SeminarHomeProvider } from '@/components/home/SeminarHomeContext'
import HomeSeminarReplay from '@/components/home/HomeSeminarReplay'
import HomeUpcomingSeminars from '@/components/home/HomeUpcomingSeminars'

/**
 * 메인 페이지 (`_docsRules/frontend_www/main.md`)
 * - 히어로 → 다가오는 세미나(가로 단일 카드) → 최신 아티클 → 최신 비디오 → 세미나 다시보기
 */
export default function Home() {
  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <HomeHeroCarousel />

        <SeminarHomeProvider>
          <HomeUpcomingSeminars />

          <HomeLatestArticles />

          <div className="pb-12">
            <HomeLatestVideos />
            <HomeSeminarReplay />
          </div>
        </SeminarHomeProvider>
      </div>
    </main>
  )
}

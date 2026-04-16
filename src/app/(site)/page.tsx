'use client'

import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
import HomeLatestArticles from '@/components/home/HomeLatestArticles'
import HomeLatestVideos from '@/components/home/HomeLatestVideos'
import { SeminarHomeProvider } from '@/components/home/SeminarHomeContext'
import HomeSeminarReplay from '@/components/home/HomeSeminarReplay'
import HomeUpcomingSeminars from '@/components/home/HomeUpcomingSeminars'
import { useSeminarWwwEnabled } from '@/hooks/useSeminarWwwEnabled'

/**
 * 메인 페이지 (`_docsRules/frontend_www/main.md`)
 * - 히어로 → 다가오는 세미나(가로 단일 카드) → 최신 아티클 → 최신 비디오 → 세미나 다시보기
 * - `SYS26416B001` sysCodeValue `N`이면 다가오는 세미나·세미나 다시보기 미표시
 */
export default function Home() {
  const seminarWwwEnabled = useSeminarWwwEnabled()

  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <HomeHeroCarousel />

        {seminarWwwEnabled ? (
          <SeminarHomeProvider>
            <HomeUpcomingSeminars />

            <HomeLatestArticles />

            <div className="pb-12">
              <HomeLatestVideos />
              <HomeSeminarReplay />
            </div>
          </SeminarHomeProvider>
        ) : (
          <>
            <HomeLatestArticles />

            <div className="pb-12">
              <HomeLatestVideos />
            </div>
          </>
        )}
      </div>
    </main>
  )
}

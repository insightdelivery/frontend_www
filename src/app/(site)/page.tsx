'use client'

import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
import HomeLatestArticles from '@/components/home/HomeLatestArticles'
import HomeCuration from '@/components/home/HomeCuration'
import HomeLatestVideos from '@/components/home/HomeLatestVideos'
import HomePopularArticles from '@/components/home/HomePopularArticles'
import { ArticleCategoryPills } from '@/components/article/ArticleCategoryPills'
import { SeminarHomeProvider } from '@/components/home/SeminarHomeContext'
import HomeSeminarReplay from '@/components/home/HomeSeminarReplay'
import HomeUpcomingSeminars from '@/components/home/HomeUpcomingSeminars'
import { useSeminarWwwEnabled } from '@/hooks/useSeminarWwwEnabled'

/**
 * 메인 페이지 (`_docsRules/frontend_www/main.md`)
 * - 히어로 → 다가오는 세미나 → 최신 아티클 → 특집 → 아티클 카테고리 → 최신 비디오 → 인기 아티클 → 세미나 다시보기
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

            <HomeCuration />

            <ArticleCategoryPills />

            <div className="pb-12">
              <HomeLatestVideos />
              <HomePopularArticles />
              <HomeSeminarReplay />
            </div>
          </SeminarHomeProvider>
        ) : (
          <>
            <HomeLatestArticles />

            <HomeCuration />

            <ArticleCategoryPills />

            <div className="pb-12">
              <HomeLatestVideos />
              <HomePopularArticles />
            </div>
          </>
        )}
      </div>
    </main>
  )
}

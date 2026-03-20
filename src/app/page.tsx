'use client'

import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
import HomeLatestArticles from '@/components/home/HomeLatestArticles'
import HomeLatestVideos from '@/components/home/HomeLatestVideos'

/**
 * 메인 페이지 (wwwMainPage.md)
 * - 히어로: eventBannerPlan + HomeHeroCarousel
 * - 다가오는 세미나 / 세미나 다시보기: 비활성(추후 구현)
 * - 최신 아티클·비디오: 각 최신 3건 API
 */
export default function Home() {
  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <HomeHeroCarousel />

        <HomeLatestArticles />

        <div className="pb-12">
          <HomeLatestVideos />
        </div>
      </div>
    </main>
  )
}

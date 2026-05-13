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
import { SITE_HOME_RAIL_MAX_CLASS } from '@/lib/siteLayoutWidth'

/**
 * 메인 페이지 — `_docsRules/1_planDoc/wwwMainpagePlan.md` 에디토리얼 레일 840px
 */
export default function Home() {
  const seminarWwwEnabled = useSeminarWwwEnabled()

  return (
    <main className="bg-paper text-ink-900">
      <div className={`mx-auto w-full ${SITE_HOME_RAIL_MAX_CLASS} max-sm:px-5 pb-16 md:pb-20`}>
        <HomeHeroCarousel />

        {seminarWwwEnabled ? (
          <SeminarHomeProvider>
            <HomeUpcomingSeminars />

            <HomeLatestArticles />

            <HomeCuration />

            <ArticleCategoryPills />

            <div className="space-y-0">
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

            <div className="space-y-0">
              <HomeLatestVideos />
              <HomePopularArticles />
            </div>
          </>
        )}
      </div>
    </main>
  )
}

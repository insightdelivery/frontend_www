'use client'

import PublicVideoSeminarListPage from '@/components/content-list/PublicVideoSeminarListPage'

/** 비디오 리스트 Hero 전용 — `_docsRules/frontend_www/video/list.md` §5.1 */
const VIDEO_LIST_HERO_EVENT_TYPE_CODE = 'SYS26320B007'

export default function VideoPage() {
  return (
    <PublicVideoSeminarListPage
      heroEventTypeCode={VIDEO_LIST_HERO_EVENT_TYPE_CODE}
      listContentType="video"
      detailPathPrefix="/video/detail"
      pageTitle="비디오"
      pageSubtitle="큐레이션된 비디오 콘텐츠를 통해 최신 트렌드와 인사이트를 만나보세요."
      emptyListMessage="등록된 비디오가 없습니다"
    />
  )
}

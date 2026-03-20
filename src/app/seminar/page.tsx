'use client'

import PublicVideoSeminarListPage from '@/components/content-list/PublicVideoSeminarListPage'

/** 세미나 리스트 Hero 전용 — `_docsRules/frontend_www/seminar/list.md` §5.1 */
const SEMINAR_LIST_HERO_EVENT_TYPE_CODE = 'SYS26320B008'

export default function SeminarPage() {
  return (
    <PublicVideoSeminarListPage
      heroEventTypeCode={SEMINAR_LIST_HERO_EVENT_TYPE_CODE}
      listContentType="seminar"
      detailPathPrefix="/seminar/detail"
      pageTitle="세미나"
      pageSubtitle="큐레이션된 세미나 영상으로 현장 인사이트와 실무 노하우를 만나보세요."
      emptyListMessage="등록된 세미나가 없습니다"
    />
  )
}

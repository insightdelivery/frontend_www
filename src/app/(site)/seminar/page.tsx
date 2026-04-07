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
      pageSubtitle=""
      emptyListMessage="등록된 세미나가 없습니다"
    />
  )
}

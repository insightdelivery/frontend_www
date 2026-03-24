/** Hero API 슬라이드 항목 (서버 최종 title/imageUrl/subtitle) */
export interface DisplayEventHeroItem {
  displayEventId: number
  eventTypeCode: string
  contentTypeCode: string
  contentId: number | null
  title: string | null
  subtitle: string | null
  /** 히어로 상단 칩. 없거나 공백이면 www에서 칩 미표시 */
  badgeText?: string | null
  imageUrl: string | null
  linkUrl: string | null
  content: {
    id: number
    title?: string
    thumbnail?: string | null
    subtitle?: string | null
  } | null
  /** 관리자 API에서만 포함 (공개 Hero API에는 없음) */
  displayOrder?: number
  isActive?: boolean
  startAt?: string | null
  endAt?: string | null
}

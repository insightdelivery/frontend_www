export type SearchContentKind = 'article' | 'video' | 'seminar'

/** 통합 검색 API `GET /api/search/?q=` — 매칭 우선순위 (낮을수록 상위): 1 제목 … 5 본문, 6 작성자·출연 등 */
export type SearchContentItem = {
  id: number
  title: string
  subtitle?: string | null
  thumbnail: string
  category: string
  writer: string
  tags: string[]
  priority?: number
}

export type UnifiedSearchResult = {
  article: SearchContentItem[]
  video: SearchContentItem[]
  seminar: SearchContentItem[]
}

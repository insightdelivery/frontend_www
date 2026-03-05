/** 아티클 목록 항목 (공개 API 응답) */
export interface ArticleListItem {
  id: number
  title: string
  subtitle: string | null
  thumbnail: string | null
  category: string
  author: string
  authorAffiliation: string | null
  isEditorPick: number | boolean
  viewCount: number
  commentCount: number
  highlightCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

/** 아티클 목록 API 응답 (IndeAPIResponse.Result) */
export interface ArticleListResponse {
  articles: ArticleListItem[]
  total: number
  page: number
  pageSize: number
}

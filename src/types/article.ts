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

/** 아티클 상세 (공개 API 상세 조회 응답) */
export interface ArticleDetail {
  id: number
  title: string
  subtitle: string | null
  content: string
  thumbnail: string | null
  category: string
  author: string
  authorAffiliation: string | null
  isEditorPick: boolean
  viewCount: number
  rating: number | null
  commentCount: number
  highlightCount: number
  questionCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

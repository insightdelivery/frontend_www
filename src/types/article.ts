/** 아티클 목록 항목 (공개 API 응답) */
export interface ArticleListItem {
  id: number
  title: string
  subtitle: string | null
  thumbnail: string | null
  category: string
  author: string
  /** ContentAuthor 프로필(presigned). 목록 API가 내려줄 때만 */
  authorProfileImage?: string | null
  authorAffiliation: string | null
  isEditorPick: number | boolean
  viewCount: number
  commentCount: number
  highlightCount: number
  /** API는 콤마 구분 문자열 또는 문자열 배열 가능 — `fetchArticleList`에서 `string[]`로 정규화 */
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
  /** ContentAuthor PK. 없으면 에디터 글 목록 링크 비활성 */
  author_id?: number | null
  /** 연결 ContentAuthor 프로필(presigned URL). 없으면 null → www는 `/editorDefault.png` */
  authorProfileImage?: string | null
  authorAffiliation: string | null
  isEditorPick: boolean
  viewCount: number
  rating: number | null
  commentCount: number
  highlightCount: number
  questionCount: number
  /** API는 콤마 구분 문자열 또는 문자열 배열 가능 — `fetchArticleDetail`에서 `string[]`로 정규화 */
  tags: string[]
  createdAt: string
  updatedAt: string
  /** 비회원일 때 본문이 previewLength(%)로 잘렸으면 true — API에서만 설정 */
  contentTruncated?: boolean
  /** 공유 링크 entitlement(share_token)로 상세 본문 수신 시 true — API에서만 설정 */
  shareEntitlement?: boolean
}

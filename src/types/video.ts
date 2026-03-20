/** 공개 비디오 목록 항목 (GET /api/videos/) */
export interface PublicVideoListItem {
  id: number
  contentType: string
  category: string
  title: string
  subtitle: string | null
  thumbnail: string | null
  speaker: string | null
  speakerAffiliation: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface PublicVideoListResponse {
  videos: PublicVideoListItem[]
  total: number
  page: number
  pageSize: number
}

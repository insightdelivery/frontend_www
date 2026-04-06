/** 공개 비디오 목록 항목 (GET /api/videos/) */
export interface PublicVideoListItem {
  id: number
  contentType: string
  category: string
  title: string
  subtitle: string | null
  thumbnail: string | null
  speaker: string | null
  /** Content Author FK (관리자 연동) */
  speaker_id?: number | null
  speakerAffiliation: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
  isNewBadge?: boolean
  rating?: number | null
  videoStreamInfo?: { duration?: number | null } | null
}

export interface PublicVideoListResponse {
  videos: PublicVideoListItem[]
  total: number
  page: number
  pageSize: number
}

export interface VideoAttachment {
  url: string
  name?: string
  filename?: string
  size?: number
}

/** 공개 비디오/세미나 상세 (GET /api/videos/{id}/) */
export interface PublicVideoDetail {
  id: number
  contentType: 'video' | 'seminar' | string
  sourceType: 'FILE_UPLOAD' | 'VIMEO' | 'YOUTUBE' | string
  videoStreamId?: string | null
  videoUrl?: string | null
  title: string
  subtitle?: string | null
  body?: string | null
  thumbnail?: string | null
  speaker?: string | null
  speaker_id?: number | null
  speakerAffiliation?: string | null
  editor?: string | null
  director?: string | null
  tags?: string[] | null
  questions?: string[] | null
  attachments?: VideoAttachment[] | null
  viewCount?: number
  rating?: number | null
  commentCount?: number
  createdAt?: string
  category?: string
  videoStreamInfo?: {
    duration?: number | null
    embedUrl?: string | null
    thumbnailUrl?: string | null
  } | null
  /** 공유 entitlement로 회원과 동일 열람 시 (contentShareLinkCopy.md §10.9) */
  shareEntitlement?: boolean
}

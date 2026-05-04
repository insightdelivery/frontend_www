'use client'

import Link from 'next/link'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import {
  CONTENT_CARD_BADGE_STYLES,
  CONTENT_CARD_HOVER_ZOOM_CLASS,
  normalizeContentCardBadges,
  type ArticleCardBadge,
} from '@/components/article/articleBadges'

export type { ArticleCardBadge }

export interface ArticleCardProps {
  id: string
  title: string
  /** API subtitle — null/빈 문자열이면 미표시 (list.md §3.1) */
  subtitle?: string | null
  categoryName?: string
  /** NEW·BEST 동시 표시 가능. 표시 순서: NEW → BEST (list.md) */
  badges?: ArticleCardBadge[]
  /** S3 또는 Presigned URL. 있으면 img 사용, 없으면 imageGradient 사용 */
  thumbnail?: string | null
  /** 썸네일이 없을 때만 사용하는 그라데이션 클래스 */
  imageGradient?: string
}

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500'

/** 제목 위 카테고리 라벨 통일 스타일 (list.md §3.2) */
const CATEGORY_LABEL_CLASS =
  'inline-flex items-center rounded-[6px] px-3 py-1.5 text-[12px] font-bold text-white font-sans bg-[#8D93FF]'

export function getCategoryPillClass(_name: string): string {
  return CATEGORY_LABEL_CLASS
}

export function ArticleCard({
  id,
  title,
  subtitle,
  categoryName = '카테고리',
  badges,
  thumbnail,
  imageGradient = DEFAULT_GRADIENT,
}: ArticleCardProps) {
  const gradient = imageGradient || DEFAULT_GRADIENT
  const sub = typeof subtitle === 'string' ? subtitle.trim() : ''
  const badgeList = normalizeContentCardBadges(badges)
  const thumbSrc = resolveArticleThumbnailUrl(thumbnail ?? null)

  return (
    <Link href={`/article/detail?id=${encodeURIComponent(id)}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              className={`h-full w-full object-cover ${CONTENT_CARD_HOVER_ZOOM_CLASS}`}
            />
          ) : (
            <div className={`h-full w-full ${gradient} ${CONTENT_CARD_HOVER_ZOOM_CLASS}`} />
          )}
        </div>
        {badgeList.length > 0 ? (
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            {badgeList.map((b) => (
              <span
                key={b}
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${CONTENT_CARD_BADGE_STYLES[b]}`}
              >
                {b}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-[15px] sm:text-[17px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
        {title}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[12px] sm:text-[13px] text-gray-500 leading-snug line-clamp-2">
          {sub}
        </p>
      ) : null}
    </Link>
  )
}

'use client'

import Link from 'next/link'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { articleDetailPath } from '@/lib/contentDetailRoutes'
import {
  editorialCardLift,
  editorialCatBadge,
  editorialThumbHover,
} from '@/components/home/editorialClasses'
import {
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

const MOBILE_THUMB_CLASS =
  'relative h-[120px] w-[160px] shrink-0 overflow-hidden rounded-none bg-cream-2'

export function getCategoryPillClass(_name: string): string {
  return editorialCatBadge
}

export function ArticleCard({
  id,
  title,
  subtitle,
  categoryName = '카테고리',
  thumbnail,
  imageGradient = DEFAULT_GRADIENT,
}: ArticleCardProps) {
  const gradient = imageGradient || DEFAULT_GRADIENT
  const sub = typeof subtitle === 'string' ? subtitle.trim() : ''
  const thumbSrc = resolveArticleThumbnailUrl(thumbnail ?? null)
  const catName = categoryName.trim() || '—'
  const href = articleDetailPath(id)

  return (
    <>
      <Link href={href} className={`group flex gap-3 text-left sm:hidden ${editorialCardLift}`}>
        <div className={MOBILE_THUMB_CLASS}>
          {thumbSrc ? (
            <img src={thumbSrc} alt="" className={`h-full w-full object-cover ${editorialThumbHover}`} />
          ) : (
            <div className={`h-full w-full ${gradient} ${editorialThumbHover}`} />
          )}
          <span className={editorialCatBadge}>{catName}</span>
        </div>
        <div className="min-w-0 flex-1 self-start pt-0.5">
          <h3 className="m-0 line-clamp-2 text-[20px] font-bold leading-snug tracking-tight text-ink-900">
            {title}
          </h3>
          {sub ? (
            <p className="mt-1.5 line-clamp-2 text-[18px] font-normal leading-relaxed text-ink-500">
              {sub}
            </p>
          ) : null}
        </div>
      </Link>

      <Link href={href} className={`group hidden sm:block ${editorialCardLift}`}>
        <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-none bg-cream-2">
          {thumbSrc ? (
            <img src={thumbSrc} alt="" className={`h-full w-full object-cover ${editorialThumbHover}`} />
          ) : (
            <div className={`h-full w-full ${gradient} ${editorialThumbHover}`} />
          )}
          <span className={editorialCatBadge}>{catName}</span>
        </div>
        <h3 className="m-0 line-clamp-2 text-[20px] font-extrabold leading-[1.35] tracking-[-0.02em] text-ink-900">
          {title}
        </h3>
        {sub ? (
          <p className="mt-2 line-clamp-2 text-[16px] leading-[1.55] text-ink-500">
            {sub}
          </p>
        ) : null}
      </Link>
    </>
  )
}

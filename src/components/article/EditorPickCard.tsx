'use client'

import Link from 'next/link'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { CONTENT_CARD_HOVER_ZOOM_CLASS } from '@/components/article/articleBadges'

export interface EditorPickCardProps {
  id: string
  title: string
  subtitle?: string | null
  /** S3 또는 Presigned URL. 있으면 img 사용, 없으면 imageGradient 사용 */
  thumbnail?: string | null
  imageGradient?: string
  imageShape?: 'circle' | 'square'
}

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-amber-200 to-amber-600'

export function EditorPickCard({
  id,
  title,
  subtitle,
  thumbnail,
  imageGradient = DEFAULT_GRADIENT,
  imageShape = 'circle',
}: EditorPickCardProps) {
  const gradient = imageGradient || DEFAULT_GRADIENT
  const sub = typeof subtitle === 'string' ? subtitle.trim() : ''
  const shapeClass = imageShape === 'circle' ? 'rounded-full' : 'rounded-lg'
  const thumbSrc = resolveArticleThumbnailUrl(thumbnail ?? null)
  return (
    <Link
      href={`/article/detail?id=${encodeURIComponent(id)}`}
      className="flex gap-3 sm:gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm group hover:border-gray-300 hover:bg-gray-50 transition-colors min-w-0"
    >
      <div
        className={`relative h-14 w-14 shrink-0 overflow-hidden sm:h-16 sm:w-16 ${shapeClass}`}
      >
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
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="text-[14px] sm:text-[15px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
          {title}
        </p>
        {sub ? (
          <p className="mt-0.5 text-[12px] sm:text-[13px] text-gray-500 leading-snug line-clamp-2">
            {sub}
          </p>
        ) : null}
      </div>
    </Link>
  )
}

'use client'

import Link from 'next/link'

export interface ArticleCardProps {
  id: string
  title: string
  categoryName?: string
  editorName?: string
  tag?: 'NEW' | 'BEST'
  /** S3 또는 Presigned URL. 있으면 img 사용, 없으면 imageGradient 사용 */
  thumbnail?: string | null
  /** 썸네일이 없을 때만 사용하는 그라데이션 클래스 */
  imageGradient?: string
}

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500'

export function ArticleCard({
  id,
  title,
  categoryName = '카테고리명',
  editorName = '에디터 이름',
  tag,
  thumbnail,
  imageGradient = DEFAULT_GRADIENT,
}: ArticleCardProps) {
  const gradient = imageGradient || DEFAULT_GRADIENT
  return (
    <Link href={`/article/detail?id=${encodeURIComponent(id)}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="aspect-[4/3] sm:aspect-[3/2] w-full object-cover"
          />
        ) : (
          <div className={`aspect-[4/3] sm:aspect-[3/2] ${gradient}`} />
        )}
        {tag && (
          <span
            className={[
              'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-black',
              tag === 'NEW' ? 'bg-neon-yellow' : 'bg-brand-orange text-white',
            ].join(' ')}
          >
            {tag}
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] sm:text-[12px] text-gray-500">{categoryName}</p>
      <p className="mt-0.5 text-[15px] sm:text-[17px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
        {title}
      </p>
      <p className="mt-1 text-[11px] sm:text-[12px] text-gray-500">{editorName}</p>
    </Link>
  )
}

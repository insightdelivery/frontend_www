'use client'

import Link from 'next/link'

export interface ArticleCardProps {
  id: string
  title: string
  categoryName?: string
  tag?: 'NEW' | 'BEST'
  /** S3 또는 Presigned URL. 있으면 img 사용, 없으면 imageGradient 사용 */
  thumbnail?: string | null
  /** 썸네일이 없을 때만 사용하는 그라데이션 클래스 */
  imageGradient?: string
}

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500'

/** 카테고리명으로 pill 스타일 클래스 반환 (시인성·컬러) */
const CATEGORY_PILL_STYLES = [
  'bg-white border border-emerald-300 text-emerald-800',
  'bg-white border border-amber-300 text-amber-800',
  'bg-white border border-sky-300 text-sky-800',
  'bg-white border border-violet-300 text-violet-800',
  'bg-white border border-rose-300 text-rose-800',
  'bg-white border border-teal-300 text-teal-800',
  'bg-white border border-orange-200 text-orange-800',
  'bg-white border border-slate-300 text-slate-700',
] as const

export function getCategoryPillClass(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i)
  const i = Math.abs(h) % CATEGORY_PILL_STYLES.length
  return `inline-flex items-center rounded-full px-3 py-1.5 text-[12px] sm:text-[13px] font-semibold ${CATEGORY_PILL_STYLES[i]}`
}

export function ArticleCard({
  id,
  title,
  categoryName = '카테고리',
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
      {categoryName ? (
        <span className={`mt-2 inline-block ${getCategoryPillClass(categoryName)}`}>
          {categoryName}
        </span>
      ) : null}
      <p className="mt-2 text-[15px] sm:text-[17px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
        {title}
      </p>
    </Link>
  )
}

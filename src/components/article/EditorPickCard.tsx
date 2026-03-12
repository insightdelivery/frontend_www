'use client'

import Link from 'next/link'

export interface EditorPickCardProps {
  id: string
  title: string
  /** S3 또는 Presigned URL. 있으면 img 사용, 없으면 imageGradient 사용 */
  thumbnail?: string | null
  imageGradient?: string
  imageShape?: 'circle' | 'square'
}

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-amber-200 to-amber-600'

export function EditorPickCard({
  id,
  title,
  thumbnail,
  imageGradient = DEFAULT_GRADIENT,
  imageShape = 'circle',
}: EditorPickCardProps) {
  const gradient = imageGradient || DEFAULT_GRADIENT
  const shapeClass = imageShape === 'circle' ? 'rounded-full' : 'rounded-lg'
  return (
    <Link
      href={`/article/detail?id=${encodeURIComponent(id)}`}
      className="flex gap-3 sm:gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm group hover:border-gray-300 hover:bg-gray-50 transition-colors min-w-0"
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 object-cover ${shapeClass}`}
        />
      ) : (
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 overflow-hidden ${gradient} ${shapeClass}`}
        />
      )}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="text-[14px] sm:text-[15px] font-extrabold leading-snug line-clamp-2 group-hover:text-gray-600 transition-colors">
          {title}
        </p>
      </div>
    </Link>
  )
}

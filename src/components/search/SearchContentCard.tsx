'use client'

import Link from 'next/link'
import type { SearchContentItem, SearchContentKind } from '@/types/search'
import { resolveSearchCategoryLabel } from '@/components/search/resolveSearchCategoryLabel'

const THUMB_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect fill="#e5e7eb" width="120" height="80"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="11" font-family="system-ui">No image</text></svg>'
  )

function detailHref(kind: SearchContentKind, id: number): string {
  const q = `id=${encodeURIComponent(String(id))}`
  if (kind === 'article') return `/article/detail?${q}`
  if (kind === 'video') return `/video/detail?${q}`
  return `/seminar/detail?${q}`
}

function matchPriorityLabel(kind: SearchContentKind, p: number | undefined): string | null {
  if (p === undefined || p === null || p >= 999) return null
  switch (p) {
    case 1:
      return '제목'
    case 2:
      return '부제목'
    case 3:
      return '카테고리'
    case 4:
      return '태그'
    case 5:
      return '내용'
    case 6:
      return kind === 'article' ? '작성자' : '출연·기타'
    default:
      return null
  }
}

type Props = {
  item: SearchContentItem
  kind: SearchContentKind
}

export default function SearchContentCard({ item, kind }: Props) {
  const categoryLabel = resolveSearchCategoryLabel(item.category, kind)
  const tags = Array.isArray(item.tags) ? item.tags : []
  const badge = matchPriorityLabel(kind, item.priority)
  const sub =
    typeof item.subtitle === 'string' && item.subtitle.trim().length > 0 ? item.subtitle.trim() : ''

  return (
    <Link
      href={detailHref(kind, item.id)}
      className="flex gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
    >
      <img
        src={item.thumbnail || THUMB_PLACEHOLDER}
        alt=""
        className="h-[80px] w-[120px] shrink-0 rounded bg-gray-100 object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = THUMB_PLACEHOLDER
        }}
      />
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">{categoryLabel || '—'}</span>
          {badge ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 font-bold text-black line-clamp-2">{item.title}</div>
        {sub ? (
          <div className="mt-1 text-xs text-gray-600 line-clamp-2">{sub}</div>
        ) : null}
        {item.writer ? (
          <div className="mt-1 text-xs text-gray-500">{item.writer}</div>
        ) : null}
        {tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import type { HighlightMypageItem } from '@/services/highlightMypage'

function formatItemTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export interface HighlightCardProps {
  item: HighlightMypageItem
  onDelete: (highlightGroupId: number) => void
}

export default function HighlightCard({ item, onDelete }: HighlightCardProps) {
  const href = `/article/detail?id=${encodeURIComponent(String(item.articleId))}`

  return (
    <div className="flex min-h-[400px] flex-col rounded-xl bg-gray-100 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex min-h-0 flex-1 flex-col">
        <Link href={href} className="block shrink-0">
          <p className="line-clamp-4 text-sm font-medium leading-6 text-[#0f172a]">{item.highlightText}</p>
        </Link>

        {/* 날짜 + (썸네일·제목 | 삭제) — 카드 하단 고정 */}
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <p className="text-xs text-gray-500">{formatItemTime(item.createdAt)}</p>

          <div className="flex items-start gap-3">
            <Link
              href={href}
              className="flex min-w-0 flex-1 items-start gap-2 text-left"
            >
              {item.thumbnail ? (
                <div className="relative mt-0.5 aspect-[3/2] w-20 shrink-0 overflow-hidden rounded sm:w-24">
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="mt-0.5 aspect-[3/2] w-20 shrink-0 rounded bg-gray-300 sm:w-24"
                  aria-hidden
                />
              )}
              <span className="text-xs leading-snug text-[#0f172a] break-words whitespace-normal">
                {item.articleTitle}
              </span>
            </Link>
            <button
              type="button"
              className="shrink-0 self-end rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-red-600"
              aria-label="하이라이트 삭제"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(item.highlightGroupId)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

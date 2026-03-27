'use client'

import Image from 'next/image'
import type { HighlightMypageGroup } from '@/services/highlightMypage'
import HighlightGrid from './HighlightGrid'

export interface HighlightArticleViewProps {
  groups: HighlightMypageGroup[]
  onDelete: (highlightGroupId: number) => void
}

export default function HighlightArticleView({ groups, onDelete }: HighlightArticleViewProps) {
  return (
    <div className="space-y-12">
      {groups.map((g) => {
        const first = g.items[0]
        const thumb = first?.thumbnail
        const title = first?.articleTitle ?? `아티클 ${g.groupKey}`
        return (
          <div key={g.groupKey} className="border-b border-[#e2e8f0] pb-10 last:border-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {thumb ? (
                <div className="relative aspect-[3/2] w-14 shrink-0 overflow-hidden rounded sm:w-16">
                  <Image src={thumb} alt="" fill className="object-cover" sizes="64px" unoptimized />
                </div>
              ) : (
                <div className="aspect-[3/2] w-14 shrink-0 rounded bg-gray-200 sm:w-16" aria-hidden />
              )}
              <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
              <span className="text-sm text-gray-500">{g.items.length}</span>
            </div>
            <HighlightGrid items={g.items} onDelete={onDelete} />
          </div>
        )
      })}
    </div>
  )
}

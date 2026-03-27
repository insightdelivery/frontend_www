'use client'

import type { HighlightMypageItem } from '@/services/highlightMypage'
import HighlightCard from './HighlightCard'

export interface HighlightGridProps {
  items: HighlightMypageItem[]
  onDelete: (highlightGroupId: number) => void
}

export default function HighlightGrid({ items, onDelete }: HighlightGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <HighlightCard key={item.highlightGroupId} item={item} onDelete={onDelete} />
      ))}
    </div>
  )
}

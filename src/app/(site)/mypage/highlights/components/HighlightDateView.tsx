'use client'

import type { HighlightMypageGroup } from '@/services/highlightMypage'
import HighlightGrid from './HighlightGrid'
import HighlightGroup from './HighlightGroup'

function formatSectionHeading(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateKey
  return d.toLocaleDateString('ko-KR', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export interface HighlightDateViewProps {
  groups: HighlightMypageGroup[]
  onDelete: (highlightGroupId: number) => void
}

export default function HighlightDateView({ groups, onDelete }: HighlightDateViewProps) {
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <HighlightGroup key={g.groupKey} title={formatSectionHeading(g.groupKey)}>
          <HighlightGrid items={g.items} onDelete={onDelete} />
        </HighlightGroup>
      ))}
    </div>
  )
}

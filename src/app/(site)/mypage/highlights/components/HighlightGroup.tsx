'use client'

import type { ReactNode } from 'react'

/** 날짜/아티클 섹션 래퍼 (wwwMypage_Highlights.md §4 — Group → 그룹 UI) */
export default function HighlightGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-[#0f172a]">{title}</h2>
      {children}
    </section>
  )
}

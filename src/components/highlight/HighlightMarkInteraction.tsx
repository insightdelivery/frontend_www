'use client'

import { useEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useHighlight } from './HighlightContext'

/**
 * mark 클릭 → 취소 버튼 → DELETE (articleHightlightPlan.md §18.3)
 */
export function HighlightMarkInteraction({ contentRootRef }: { contentRootRef: RefObject<HTMLElement | null> }) {
  const ctx = useHighlight()
  const [cancelUi, setCancelUi] = useState<{
    id: number
    top: number
    left: number
    markRect: DOMRect
  } | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest('.highlight-cancel-popover')) return
      const mark = t.closest('mark[data-highlight-id]') as HTMLElement | null
      if (mark && contentRootRef.current?.contains(mark)) {
        const id = parseInt(mark.getAttribute('data-highlight-id') || '', 10)
        if (!Number.isNaN(id)) {
          const rect = mark.getBoundingClientRect()
          setCancelUi({
            id,
            top: rect.bottom + 8,
            left: Math.max(8, Math.min(rect.left, typeof window !== 'undefined' ? window.innerWidth - 200 : rect.left)),
            markRect: rect,
          })
        }
        return
      }
      setCancelUi(null)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [contentRootRef])

  const handleCancel = async () => {
    if (!cancelUi || !ctx) return
    const { markRect } = cancelUi
    try {
      await ctx.deleteHighlightById(cancelUi.id)
      ctx.showHighlightTooltip('하이라이트가 취소되었습니다.', markRect)
      setCancelUi(null)
    } catch {
      ctx.showHighlightTooltip('하이라이트를 취소하지 못했습니다.', markRect)
    }
  }

  if (typeof document === 'undefined' || !cancelUi) return null

  return createPortal(
    <div
      className="highlight-cancel-popover pointer-events-auto fixed z-[150]"
      style={{ top: cancelUi.top, left: cancelUi.left }}
    >
      <button
        type="button"
        className="highlight-cancel-btn rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#0f172a] shadow-lg hover:bg-slate-50"
        onClick={(e) => {
          e.stopPropagation()
          void handleCancel()
        }}
      >
        하이라이트 취소
      </button>
    </div>,
    document.body
  )
}

'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useHighlight } from './HighlightContext'

/**
 * mark 클릭/탭 → 취소 버튼 → DELETE (articleHightlightPlan.md §18.3)
 * 모바일: document `click`만으로는 mark/버튼이 누락되는 경우가 있어 pointer 이벤트를 병용한다.
 */
export function HighlightMarkInteraction({ contentRootRef }: { contentRootRef: RefObject<HTMLElement | null> }) {
  const ctx = useHighlight()
  const [cancelUi, setCancelUi] = useState<{
    id: number
    top: number
    left: number
    markRect: DOMRect
  } | null>(null)
  const cancelingRef = useRef(false)
  const cancelPointerHandledRef = useRef(false)

  const openForMark = (mark: HTMLElement) => {
    const id = parseInt(mark.getAttribute('data-highlight-id') || '', 10)
    if (Number.isNaN(id)) return
    const rect = mark.getBoundingClientRect()
    setCancelUi({
      id,
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, typeof window !== 'undefined' ? window.innerWidth - 200 : rect.left)),
      markRect: rect,
    })
  }

  useEffect(() => {
    const eventToElement = (target: EventTarget | null): Element | null => {
      if (!target || !(target instanceof Node)) return null
      return target.nodeType === Node.TEXT_NODE ? target.parentElement : (target as Element)
    }

    const onPointerDownCapture = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const t = eventToElement(e.target)
      if (!t) return
      if (t.closest('.highlight-cancel-popover')) return
      const mark = t.closest('mark[data-highlight-id]') as HTMLElement | null
      if (mark && contentRootRef.current?.contains(mark)) {
        openForMark(mark)
        return
      }
      setCancelUi(null)
    }

    const onClick = (e: MouseEvent) => {
      const t = eventToElement(e.target)
      if (!t) return
      if (t.closest('.highlight-cancel-popover')) return
      const mark = t.closest('mark[data-highlight-id]') as HTMLElement | null
      if (mark && contentRootRef.current?.contains(mark)) {
        openForMark(mark)
        return
      }
      setCancelUi(null)
    }

    document.addEventListener('pointerdown', onPointerDownCapture, true)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('pointerdown', onPointerDownCapture, true)
      document.removeEventListener('click', onClick)
    }
  }, [contentRootRef])

  const handleCancel = async () => {
    if (!cancelUi || !ctx || cancelingRef.current) return
    const { markRect } = cancelUi
    cancelingRef.current = true
    try {
      await ctx.deleteHighlightById(cancelUi.id)
      ctx.showHighlightTooltip('하이라이트가 취소되었습니다.', markRect)
      setCancelUi(null)
    } catch {
      ctx.showHighlightTooltip('하이라이트를 취소하지 못했습니다.', markRect)
    } finally {
      cancelingRef.current = false
    }
  }

  const onCancelPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cancelPointerHandledRef.current = true
    void handleCancel()
  }

  const onCancelClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (cancelPointerHandledRef.current) {
      cancelPointerHandledRef.current = false
      return
    }
    void handleCancel()
  }

  if (typeof document === 'undefined' || !cancelUi) return null

  return createPortal(
    <div
      className="highlight-cancel-popover pointer-events-auto fixed z-[300]"
      style={{
        top: cancelUi.top,
        left: cancelUi.left,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <button
        type="button"
        className="highlight-cancel-btn cursor-pointer select-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0f172a] shadow-lg hover:bg-slate-50 min-h-[44px] min-w-[120px]"
        onPointerDown={onCancelPointerDown}
        onClick={onCancelClick}
      >
        하이라이트 취소
      </button>
    </div>,
    document.body
  )
}

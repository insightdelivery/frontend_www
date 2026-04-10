'use client'

import type { ReactNode } from 'react'

/**
 * 하이라이트 안내 — 선택/마크 근처 고정 툴팁 (articleHightlightPlan §18.5)
 */
export type TooltipAnchor = {
  left: number
  top: number
  width: number
  height: number
}

function domRectToAnchor(rect: DOMRect): TooltipAnchor {
  const w = Math.max(rect.width, 0)
  const h = Math.max(rect.height, 0)
  return {
    left: rect.left,
    top: rect.top,
    width: w === 0 ? 24 : w,
    height: h === 0 ? 4 : h,
  }
}

export function Tooltip({
  message,
  anchor,
}: {
  message: ReactNode | null
  /** null이면 화면 상단 중앙(폴백) */
  anchor: TooltipAnchor | null
}) {
  if (message == null || message === '') return null

  const vw = typeof window !== 'undefined' ? window.innerWidth : 400
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const gap = 8
  const approxHalf = 140

  let left: number
  let top: number
  let transform: string

  if (anchor) {
    const centerX = anchor.left + anchor.width / 2
    const safeX = Math.max(approxHalf + 8, Math.min(centerX, vw - approxHalf - 8))
    const spaceAbove = anchor.top
    const showBelow = spaceAbove < 72 && anchor.top + anchor.height + 120 < vh

    if (showBelow) {
      top = anchor.top + anchor.height + gap
      transform = 'translateX(-50%)'
    } else {
      top = anchor.top - gap
      transform = 'translate(-50%, -100%)'
    }
    left = safeX
  } else {
    left = vw / 2
    top = 96
    transform = 'translateX(-50%)'
  }

  return (
    <div
      className="pointer-events-none fixed z-[200] max-w-[min(90vw,20rem)] rounded-lg border border-[#e2e8f0] bg-[#0f172a] px-3 py-2 text-center text-[13px] font-medium leading-snug text-white shadow-lg"
      style={{ left, top, transform }}
      role="status"
    >
      {message}
    </div>
  )
}

export function toTooltipAnchor(rect: DOMRect | null | undefined): TooltipAnchor | null {
  if (!rect) return null
  return domRectToAnchor(rect)
}

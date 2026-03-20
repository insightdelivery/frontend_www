'use client'

import { useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { useHighlight } from './HighlightContext'
import { applyMarks } from './highlightUtils'

interface HighlightRendererProps {
  /** 본문 HTML 문자열 (TipTap 등에서 온 content) */
  contentHtml: string
  /** 본문 컨테이너 className */
  className?: string
}

/**
 * 본문을 렌더하고 하이라이트 목록을 DOM에 <mark>로 적용 (articleHightlightPlan 15.10).
 * 리렌더 시 innerHTML을 다시 넣은 뒤 marks 재적용.
 */
export function HighlightRenderer({ contentHtml, className }: HighlightRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const ctx = useHighlight()
  const list = ctx?.list ?? []

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sanitized =
      typeof window !== 'undefined'
        ? DOMPurify.sanitize(contentHtml, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'span', 'div'],
          })
        : contentHtml
    root.innerHTML = sanitized
    applyMarks(root, list)
  }, [contentHtml, list])

  return <div ref={rootRef} className={className} />
}

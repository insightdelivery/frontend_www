'use client'

import { useState, useCallback, useEffect, useRef, type RefObject } from 'react'
import { Highlighter } from 'lucide-react'
import { useHighlight } from './HighlightContext'
import { getHighlightConstants } from '@/lib/highlightConstants'
import { isAuthenticated } from '@/services/auth'

const BUTTON_OFFSET_TOP = 8

interface HighlightButtonProps {
  /** 클릭 시 호출. 내부에서 selection → payload 변환 후 저장. */
  onSave: () => Promise<void>
  /** 버튼 위치 (선택 영역 근처). 미전달 시 선택 영역 기준으로 자동 계산. */
  style?: React.CSSProperties
  /** 본문 루트 ref. 전달 시 선택이 이 안에 있을 때만 버튼 표시 (15.8, 명세). */
  contentRootRef?: RefObject<HTMLElement | null>
}

/**
 * 드래그 선택 시 표시되는 하이라이트 저장 버튼 (비로그인 시 미표시, 15.8).
 * 실제 저장 로직은 상위에서 paragraph/offset 계산 후 onSave로 전달.
 * 선택 영역 위쪽에 버튼을 배치하여 드래그 시 변화가 보이도록 함.
 */
export function HighlightButton({ onSave, style: styleProp, contentRootRef }: HighlightButtonProps) {
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
  const rafRef = useRef<number | null>(null)
  const overToastShownRef = useRef(false)
  const ctx = useHighlight()
  const constants = ctx?.constants ?? getHighlightConstants()

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
      setVisible(false)
    }
  }, [onSave])

  useEffect(() => {
    if (!isAuthenticated()) {
      setVisible(false)
      return
    }
    const onSelectionChange = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const sel = window.getSelection()
        if (!sel) {
          setVisible(false)
          return
        }
        const raw = sel.toString()
        const str = raw.trim()
        if (!str) {
          overToastShownRef.current = false
          setVisible(false)
          return
        }
        if (raw.length > constants.maxLength) {
          if (!overToastShownRef.current) {
            overToastShownRef.current = true
            let rect: DOMRect | null = null
            try {
              rect = sel.rangeCount > 0 ? sel.getRangeAt(0).getBoundingClientRect() : null
            } catch {
              rect = null
            }
            ctx?.showHighlightTooltip(`하이라이트는 ${constants.maxLength}자 까지 가능합니다.`, rect)
          }
          setVisible(false)
          return
        }
        overToastShownRef.current = false
        if (contentRootRef?.current) {
          const anchor = sel.anchorNode
          if (!anchor || !contentRootRef.current.contains(anchor)) {
            setVisible(false)
            return
          }
        }
        try {
          const range = sel.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          setPosition({
            left: rect.left,
            top: rect.top - BUTTON_OFFSET_TOP,
          })
          setVisible(true)
        } catch {
          setVisible(false)
        }
      })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [constants.maxLength, contentRootRef, ctx?.showHighlightTooltip])

  if (!visible) return null

  const style: React.CSSProperties = {
    position: 'fixed',
    left: position.left,
    top: position.top,
    transform: 'translateY(-100%)',
    ...styleProp,
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="fixed z-50 flex items-center gap-1.5 rounded-lg bg-[#0f172a] text-white px-3 py-2 text-sm font-medium shadow-lg hover:bg-[#1e293b] disabled:opacity-60"
      style={style}
      aria-label="하이라이트 저장"
    >
      <Highlighter className="h-4 w-4" />
      {saving ? '저장 중...' : '하이라이트'}
    </button>
  )
}

'use client'

import { useState, useCallback, useEffect, useRef, type RefObject } from 'react'
import { Highlighter } from 'lucide-react'
import { useHighlight } from './HighlightContext'
import { getHighlightConstants } from '@/lib/highlightConstants'
import { isAuthenticated } from '@/services/auth'

const BUTTON_OFFSET_TOP = 8

interface HighlightButtonProps {
  /**
   * 저장 시 호출. 모바일에서는 탭 순간 selection이 비므로, 스냅샷한 Range가 인자로 전달된다.
   */
  onSave: (range: Range) => Promise<void>
  /** 버튼 위치 (선택 영역 근처). 미전달 시 선택 영역 기준으로 자동 계산. */
  style?: React.CSSProperties
  /** 본문 루트 ref. 전달 시 선택이 이 안에 있을 때만 버튼 표시 (15.8, 명세). */
  contentRootRef?: RefObject<HTMLElement | null>
}

/**
 * 드래그 선택 시 표시되는 하이라이트 저장 버튼 (비로그인 시 미표시, 15.8).
 * 모바일: 버튼 탭 시 브라우저가 먼저 selection을 지우므로, selectionchange 시점의 Range를 복제해 저장에 사용한다.
 */
export function HighlightButton({ onSave, style: styleProp, contentRootRef }: HighlightButtonProps) {
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
  const rafRef = useRef<number | null>(null)
  const overToastShownRef = useRef(false)
  /** 탭 시점에 selection이 사라지기 전에 잡아 둔 Range (모바일 필수) */
  const rangeSnapshotRef = useRef<Range | null>(null)
  /** pointerdown에서 이미 저장했으면 이어지는 click 무시 (데스크톱) */
  const savedByPointerRef = useRef(false)
  const ctx = useHighlight()
  const constants = ctx?.constants ?? getHighlightConstants()

  const handleSave = useCallback(
    async (range: Range) => {
      setSaving(true)
      try {
        await onSave(range)
      } finally {
        setSaving(false)
        setVisible(false)
        rangeSnapshotRef.current = null
      }
    },
    [onSave]
  )

  useEffect(() => {
    if (!isAuthenticated()) {
      setVisible(false)
      rangeSnapshotRef.current = null
      return
    }
    const onSelectionChange = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const sel = window.getSelection()
        if (!sel) {
          setVisible(false)
          rangeSnapshotRef.current = null
          return
        }
        const raw = sel.toString()
        const str = raw.trim()
        if (!str) {
          overToastShownRef.current = false
          setVisible(false)
          rangeSnapshotRef.current = null
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
          rangeSnapshotRef.current = null
          return
        }
        overToastShownRef.current = false
        if (contentRootRef?.current) {
          const anchor = sel.anchorNode
          if (!anchor || !contentRootRef.current.contains(anchor)) {
            setVisible(false)
            rangeSnapshotRef.current = null
            return
          }
        }
        try {
          const range = sel.getRangeAt(0)
          rangeSnapshotRef.current = range.cloneRange()
          const rect = range.getBoundingClientRect()
          setPosition({
            left: rect.left,
            top: rect.top - BUTTON_OFFSET_TOP,
          })
          setVisible(true)
        } catch {
          setVisible(false)
          rangeSnapshotRef.current = null
        }
      })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [constants.maxLength, contentRootRef, ctx?.showHighlightTooltip])

  const saveWithSnapshot = useCallback(() => {
    if (saving) return
    const snap = rangeSnapshotRef.current
    if (!snap) return
    let range: Range
    try {
      range = snap.cloneRange()
    } catch {
      return
    }
    void handleSave(range)
  }, [handleSave, saving])

  const onPointerDownButton = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      savedByPointerRef.current = true
      saveWithSnapshot()
    },
    [saveWithSnapshot]
  )

  const onClickButton = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (savedByPointerRef.current) {
        savedByPointerRef.current = false
        return
      }
      saveWithSnapshot()
    },
    [saveWithSnapshot]
  )

  if (!visible) return null

  const style: React.CSSProperties = {
    position: 'fixed',
    left: position.left,
    top: position.top,
    transform: 'translateY(-100%)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    ...styleProp,
  }

  return (
    <button
      type="button"
      onPointerDown={onPointerDownButton}
      onClick={onClickButton}
      disabled={saving}
      className="fixed z-50 flex items-center gap-1.5 rounded-lg bg-[#0f172a] text-white px-3 py-2 text-sm font-medium shadow-lg hover:bg-[#1e293b] disabled:opacity-60 select-none cursor-pointer"
      style={style}
      aria-label="하이라이트 저장"
    >
      <Highlighter className="h-4 w-4" />
      {saving ? '저장 중...' : '하이라이트'}
    </button>
  )
}

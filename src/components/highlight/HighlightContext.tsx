'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  fetchHighlightList,
  createHighlight,
  createHighlights,
  deleteHighlight,
  deleteHighlightGroup,
} from '@/services/highlight'
import { getAccessToken } from '@/services/auth'
import { getHighlightConstants } from '@/lib/highlightConstants'
import type { HighlightItem, HighlightCreatePayload, HighlightConstants } from '@/types/highlight'
import { Tooltip, toTooltipAnchor, type TooltipAnchor } from '@/components/ui/Tooltip'

interface HighlightContextValue {
  articleId: string | null
  list: HighlightItem[]
  loading: boolean
  constants: HighlightConstants
  setArticleId: (id: string | null) => void
  create: (payloads: HighlightCreatePayload[]) => Promise<void>
  deleteGroup: (highlightGroupId: number) => Promise<void>
  deleteHighlightById: (highlightId: number) => Promise<void>
  refresh: () => Promise<void>
  /** articleHightlightPlan §18 — 선택/마크 근처 툴팁 (anchor는 getBoundingClientRect 등) */
  showHighlightTooltip: (message: string, anchorRect?: DOMRect | null, durationMs?: number) => void
}

const HighlightContext = createContext<HighlightContextValue | null>(null)

export function useHighlight() {
  const ctx = useContext(HighlightContext)
  return ctx
}

interface HighlightProviderProps {
  articleId: string | null
  children: React.ReactNode
}

export function HighlightProvider({ articleId, children }: HighlightProviderProps) {
  const [list, setList] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(false)
  const [constants] = useState<HighlightConstants>(getHighlightConstants)
  /** 동일 articleId에 대한 in-flight 요청 1회만 — Strict Mode 이중 마운트 시 공유 */
  const highlightPromiseRef = useRef<{ articleId: string; promise: Promise<HighlightItem[]> } | null>(null)
  const [tooltip, setTooltip] = useState<{ message: string; anchor: TooltipAnchor | null } | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showHighlightTooltip = useCallback((message: string, anchorRect?: DOMRect | null, durationMs = 2000) => {
    setTooltip({
      message,
      anchor: anchorRect ? toTooltipAnchor(anchorRect) : null,
    })
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    tooltipTimerRef.current = setTimeout(() => {
      setTooltip(null)
      tooltipTimerRef.current = null
    }, durationMs)
  }, [])

  const refresh = useCallback(async () => {
    if (!articleId) {
      setList([])
      return
    }
    if (!getAccessToken()) {
      setList([])
      return
    }
    setLoading(true)
    try {
      const data = await fetchHighlightList(articleId)
      setList(data ?? [])
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }, [articleId])

  useEffect(() => {
    if (!articleId) return
    if (!getAccessToken()) {
      setList([])
      return
    }

    // 재마운트(Strict Mode) 시 이미 진행 중인 요청이 있으면 그 결과만 사용
    const inFlight = highlightPromiseRef.current
    if (inFlight?.articleId === articleId) {
      inFlight.promise
        .then((data) => setList(data ?? []))
        .catch(() => setList([]))
      return () => {}
    }

    setLoading(true)
    const promise = fetchHighlightList(articleId)
    highlightPromiseRef.current = { articleId, promise }
    promise
      .then((data) => setList(data ?? []))
      .catch(() => setList([]))
      .finally(() => {
        setLoading(false)
        highlightPromiseRef.current = null
      })
  }, [articleId])

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    }
  }, [])

  const create = useCallback(
    async (payloads: HighlightCreatePayload[]) => {
      if (!articleId || !payloads.length) return
      if (payloads.length === 1) {
        await createHighlight(payloads[0])
      } else {
        await createHighlights(payloads)
      }
      await refresh()
    },
    [articleId, refresh]
  )

  const deleteGroup = useCallback(
    async (highlightGroupId: number) => {
      await deleteHighlightGroup(highlightGroupId)
      await refresh()
    },
    [refresh]
  )

  const deleteHighlightById = useCallback(
    async (highlightId: number) => {
      await deleteHighlight(highlightId)
      await refresh()
    },
    [refresh]
  )

  const value: HighlightContextValue = {
    articleId,
    list,
    loading,
    constants,
    setArticleId: () => {},
    create,
    deleteGroup,
    deleteHighlightById,
    refresh,
    showHighlightTooltip,
  }

  return (
    <HighlightContext.Provider value={value}>
      {children}
      <Tooltip message={tooltip?.message ?? null} anchor={tooltip?.anchor ?? null} />
    </HighlightContext.Provider>
  )
}

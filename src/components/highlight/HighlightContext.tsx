'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { fetchHighlightList, createHighlight, createHighlights, deleteHighlightGroup } from '@/services/highlight'
import { getAccessToken } from '@/services/auth'
import { getHighlightConstants } from '@/lib/highlightConstants'
import type { HighlightItem, HighlightCreatePayload, HighlightConstants } from '@/types/highlight'

interface HighlightContextValue {
  articleId: string | null
  list: HighlightItem[]
  loading: boolean
  constants: HighlightConstants
  setArticleId: (id: string | null) => void
  create: (payloads: HighlightCreatePayload[]) => Promise<void>
  deleteGroup: (highlightGroupId: number) => Promise<void>
  refresh: () => Promise<void>
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
  const lastFetchedId = useRef<string | null>(null)
  /** Strict Mode 재마운트 시 첫 요청 결과 재사용 (중복 호출 없이 화면 갱신) */
  const highlightPromiseRef = useRef<{ articleId: string; promise: Promise<HighlightItem[]> } | null>(null)

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

    // 재마운트(Strict Mode) 시 이미 진행 중인 요청이 있으면 그 결과만 사용 (1회 호출 유지)
    const inFlight = highlightPromiseRef.current
    if (inFlight?.articleId === articleId) {
      inFlight.promise
        .then((data) => setList(data ?? []))
        .catch(() => setList([]))
      return () => {}
    }

    // 중복 호출 방지 (Strict Mode 대응, article_detail_duplicate_api_analysis Part II)
    if (lastFetchedId.current === articleId) return
    lastFetchedId.current = articleId

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

  const value: HighlightContextValue = {
    articleId,
    list,
    loading,
    constants,
    setArticleId: () => {},
    create,
    deleteGroup,
    refresh,
  }

  return (
    <HighlightContext.Provider value={value}>
      {children}
    </HighlightContext.Provider>
  )
}

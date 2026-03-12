'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchHighlightList, createHighlight, createHighlights, deleteHighlightGroup } from '@/services/highlight'
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

  const refresh = useCallback(async () => {
    if (!articleId) {
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
    refresh()
  }, [refresh])

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

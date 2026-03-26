'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchPublicVideoList } from '@/services/video'
import type { PublicVideoListItem } from '@/types/video'

type SeminarHomeValue = {
  upcoming: PublicVideoListItem[]
  replay: PublicVideoListItem[]
  loading: boolean
}

const SeminarHomeContext = createContext<SeminarHomeValue | null>(null)

/** 메인 세미나 블록: 4건 조회(`sort: latest`) — 다가오는=최근 등록 1건, 다시보기=그다음 3건 — 요청 1회 */
export function SeminarHomeProvider({ children }: { children: ReactNode }) {
  const [upcoming, setUpcoming] = useState<PublicVideoListItem[]>([])
  const [replay, setReplay] = useState<PublicVideoListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPublicVideoList({
        page: 1,
        pageSize: 4,
        sort: 'latest',
        contentType: 'seminar',
      })
      const list = res.videos ?? []
      const head = list[0]
      setUpcoming(head ? [head] : [])
      setReplay(list.slice(1, 4))
    } catch {
      setUpcoming([])
      setReplay([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo(
    () => ({ upcoming, replay, loading }),
    [upcoming, replay, loading]
  )

  return <SeminarHomeContext.Provider value={value}>{children}</SeminarHomeContext.Provider>
}

export function useSeminarHome(): SeminarHomeValue {
  const ctx = useContext(SeminarHomeContext)
  if (!ctx) {
    throw new Error('useSeminarHome must be used within SeminarHomeProvider')
  }
  return ctx
}

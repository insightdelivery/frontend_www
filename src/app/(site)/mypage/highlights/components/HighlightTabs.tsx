'use client'

import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import {
  deleteHighlightGroup,
  getHighlightsByArticle,
  getHighlightsByDate,
  type HighlightMypageGroup,
} from '@/services/highlightMypage'
import HighlightDateView from './HighlightDateView'
import HighlightArticleView from './HighlightArticleView'

function removeGroupFromState(groups: HighlightMypageGroup[] | null, gid: number): HighlightMypageGroup[] | null {
  if (!groups) return null
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.highlightGroupId !== gid),
    }))
    .filter((g) => g.items.length > 0)
}

export default function HighlightTabs() {
  const [tab, setTab] = useState<'date' | 'article'>('date')
  const [dateGroups, setDateGroups] = useState<HighlightMypageGroup[] | null>(null)
  const [articleGroups, setArticleGroups] = useState<HighlightMypageGroup[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, a] = await Promise.all([getHighlightsByDate(), getHighlightsByArticle()])
      setDateGroups(d)
      setArticleGroups(a)
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined
      // 백엔드가 빈 목록에서 5xx를 내는 경우 등: 사용자에게는 빈 목록과 동일 안내
      if (typeof status === 'number' && status >= 500) {
        setError(null)
      } else {
        setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.')
      }
      setDateGroups([])
      setArticleGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const handleDelete = useCallback(
    (highlightGroupId: number) => {
      if (!window.confirm('이 하이라이트를 삭제할까요?')) return
      void (async () => {
        try {
          await deleteHighlightGroup(highlightGroupId)
          setDateGroups((prev) => removeGroupFromState(prev, highlightGroupId))
          setArticleGroups((prev) => removeGroupFromState(prev, highlightGroupId))
        } catch (e) {
          window.alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
        }
      })()
    },
    []
  )

  const dateEmpty = !loading && !error && (dateGroups?.length ?? 0) === 0
  const articleEmpty = !loading && !error && (articleGroups?.length ?? 0) === 0

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-[#e2e8f0]">
        <button
          type="button"
          onClick={() => setTab('date')}
          className={`relative pb-3 text-[15px] font-medium ${
            tab === 'date' ? 'font-bold text-black' : 'text-gray-400'
          }`}
        >
          날짜별 보기
          {tab === 'date' ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E1F800]" /> : null}
        </button>
        <button
          type="button"
          onClick={() => setTab('article')}
          className={`relative pb-3 text-[15px] font-medium ${
            tab === 'article' ? 'font-bold text-black' : 'text-gray-400'
          }`}
        >
          아티클별 보기
          {tab === 'article' ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E1F800]" /> : null}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200" />
        </div>
      ) : error ? (
        <div className="py-20 text-center text-red-500">{error}</div>
      ) : tab === 'date' ? (
        dateEmpty ? (
          <div className="py-20 text-center text-gray-500">하이라이트한 콘텐츠가 없습니다.</div>
        ) : (
          <HighlightDateView groups={dateGroups ?? []} onDelete={handleDelete} />
        )
      ) : articleEmpty ? (
        <div className="py-20 text-center text-gray-500">하이라이트한 콘텐츠가 없습니다.</div>
      ) : (
        <HighlightArticleView groups={articleGroups ?? []} onDelete={handleDelete} />
      )}
    </div>
  )
}

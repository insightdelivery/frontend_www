'use client'

import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import {
  getMyAnsweredContents,
  type MyAnsweredContentItem,
} from '@/services/contentQuestion'

const PAGE_SIZE = 9

function formatAnswerDate(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}.${m}.${day}`
  } catch {
    return iso.slice(0, 10).replaceAll('-', '.')
  }
}

function cardTagText(item: MyAnsweredContentItem): string {
  const typeLabel = item.contentTypeLabel
  const cat = (item.categoryName || '').trim()
  if (cat) return `${typeLabel} | ${cat}`
  return typeLabel
}

export default function MypageAppliedQuestionsPage() {
  const [list, setList] = useState<MyAnsweredContentItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMyAnsweredContents({ page: p, page_size: PAGE_SIZE })
      setList(res.list)
      setTotal(res.total)
      setPage(res.page)
    } catch (e: unknown) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined
      if (status === 401) {
        setError('로그인 후 이용할 수 있습니다.')
      } else if (typeof status === 'number' && status >= 500) {
        // 빈 목록과 동일한 안내 (백엔드 5xx 등)
        setError(null)
      } else {
        const msg = e instanceof Error ? e.message : '목록을 불러오지 못했습니다.'
        setError(msg)
      }
      setList([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1)
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const goPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages)
    setPage(next)
    void load(next)
  }

  return (
    <div className="flex flex-col">
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <p className="text-[#6b7280]">목록을 불러오는 중...</p>
        </div>
      ) : list.length === 0 && !error ? (
        <p className="py-12 text-center text-[#6b7280]">적용질문에 답변있는 콘텐츠가 없습니다.</p>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${totalPages <= 1 ? 'pb-20' : ''}`}
          >
            {list.map((item) => (
              <article
                key={`${item.contentType}-${item.contentId}`}
                className="flex flex-col overflow-hidden rounded-xl border border-[#f1f5f9] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-col gap-4">
                  <span className="w-fit rounded-[2px] bg-[#f1f5f9] px-2 py-1 text-[10px] font-black uppercase tracking-[0.5px] text-[#475569]">
                    {cardTagText(item)}
                  </span>
                  <div className="relative h-[195px] w-full overflow-hidden rounded-lg bg-[#f1f5f9]">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="flex min-h-[49.5px] flex-col gap-1">
                    <h3 className="line-clamp-2 text-[18px] font-bold leading-[24.75px] text-[#0f172a]">
                      {item.title}
                    </h3>
                    {(item.subtitle ?? '').trim() ? (
                      <p className="line-clamp-2 text-[14px] font-normal leading-5 text-[#64748b]">
                        {(item.subtitle ?? '').trim()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[12px] leading-4 text-[#94a3b8]">
                      {formatAnswerDate(item.lastAnsweredAt)}
                    </span>
                    <Link
                      href={item.contentUrl}
                      className="rounded bg-[#e1f800] px-2 py-1 text-[12px] font-bold text-black"
                    >
                      적용질문 보기
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-20 flex justify-center gap-2 pb-20">
              <button
                type="button"
                onClick={() => goPage(page - 1)}
                disabled={page <= 1 || loading}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-50"
                aria-label="이전"
              >
                <span className="text-[#475569]">‹</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : Math.max(1, page - 2 + i)
                if (p > totalPages) return null
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goPage(p)}
                    disabled={loading}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-[16px] ${
                      p === page
                        ? 'bg-[#e1f800] font-bold text-black'
                        : 'border border-transparent font-medium text-[#475569]'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-50"
                aria-label="다음"
              >
                <span className="text-[#475569]">›</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

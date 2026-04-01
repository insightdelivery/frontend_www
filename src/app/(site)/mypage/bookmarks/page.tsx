'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getMeBookmarks, type ActivityLogItem, type ContentType } from '@/services/libraryUseractivity'
import WwwPagination from '@/components/common/WwwPagination'

const PAGE_SIZE = 10

function contentHref(contentType: ContentType, contentCode: string): string {
  switch (contentType) {
    case 'ARTICLE':
      return `/article/detail?id=${encodeURIComponent(contentCode)}`
    case 'VIDEO':
      return `/video/detail?id=${encodeURIComponent(contentCode)}`
    case 'SEMINAR':
      return `/seminar/detail?id=${encodeURIComponent(contentCode)}`
    default:
      return '#'
  }
}

function contentTypeLabel(contentType: ContentType): string {
  return { ARTICLE: '아티클', VIDEO: '비디오', SEMINAR: '세미나' }[contentType] ?? contentType
}

function formatDate(regDateTime: string | null): string {
  if (!regDateTime) return ''
  try {
    const d = new Date(regDateTime)
    return d.toISOString().slice(0, 10)
  } catch {
    return regDateTime
  }
}

type SortType = 'latest' | 'title'

export default function MypageBookmarksPage() {
  const [sort, setSort] = useState<SortType>('latest')
  const [list, setList] = useState<ActivityLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMeBookmarks({ page, page_size: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setList(res.list)
          setTotal(res.total)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const displayedList = useMemo(() => {
    if (sort === 'latest') return list
    return [...list].sort((a, b) =>
      (a.title || a.contentCode || '').localeCompare(b.title || b.contentCode || '', 'ko')
    )
  }, [list, sort])

  return (
    <div className="flex flex-col">
      <div className="flex justify-end gap-2 pb-4">
        <button
          type="button"
          onClick={() => setSort('latest')}
          className={`text-[14px] leading-5 ${sort === 'latest' ? 'text-[#0f172a]' : 'text-[#64748b]'}`}
        >
          최신순
        </button>
        <span className="text-[14px] leading-5 text-[#64748b]">/</span>
        <button
          type="button"
          onClick={() => setSort('title')}
          className={`text-[14px] leading-5 ${sort === 'title' ? 'text-[#0f172a]' : 'text-[#64748b]'}`}
        >
          제목순
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-[#6b7280]">북마크 목록을 불러오는 중...</p>
        </div>
      ) : list.length === 0 ? (
        <p className="py-12 text-center text-[#6b7280]">북마크한 콘텐츠가 없습니다.</p>
      ) : (
        <>
          <div className="divide-y divide-[#e2e8f0]">
            {displayedList.map((item) => (
              <div
                key={item.publicUserActivityLogId}
                className="flex flex-wrap items-center gap-6 py-6 sm:flex-nowrap"
              >
                <div className="flex min-w-0 flex-1 gap-6">
                  <div className="relative h-[144px] w-[192px] shrink-0 overflow-hidden rounded-lg bg-[#e2e8f0]">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="192px"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="text-[14px] leading-5 text-[#64748b]">
                      {contentTypeLabel(item.contentType)}
                    </p>
                    {item.category ? (
                      <p className="mt-1 text-[14px] leading-5 text-[#64748b]">{item.category}</p>
                    ) : null}
                    <h3 className="mt-2 text-[18px] font-bold leading-7 text-[#0f172a]">
                      {item.title || item.contentCode}
                    </h3>
                    {(item.subtitle ?? '').trim() ? (
                      <p className="mt-2 line-clamp-2 text-[14px] font-normal leading-5 text-[#64748b]">
                        {(item.subtitle ?? '').trim()}
                      </p>
                    ) : null}
                    <p className="mt-3 text-[14px] leading-5 text-[#94a3b8]">
                      북마크 날짜 : {formatDate(item.regDateTime)}
                    </p>
                  </div>
                </div>
                {item.contentMissing ? (
                  <span className="shrink-0 rounded-lg bg-[#e2e8f0] px-6 py-3 text-[16px] font-medium leading-6 text-[#64748b]">
                    콘텐츠 보러가기
                  </span>
                ) : (
                  <Link
                    href={contentHref(item.contentType, item.contentCode)}
                    className="shrink-0 rounded-lg bg-[#e1f800] px-6 py-3 text-[16px] font-medium leading-6 text-black"
                  >
                    콘텐츠 보러가기
                  </Link>
                )}
              </div>
            ))}
          </div>

          <WwwPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-20" />
        </>
      )}
    </div>
  )
}

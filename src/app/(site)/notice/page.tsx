'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Calendar, Eye } from 'lucide-react'
import { WWW_RICH_BODY_INNERHTML_BASE_CLASS } from '@/constants/wwwRichBodyHtml'
import { fetchNotices, fetchNotice } from '@/services/board'
import type { NoticeListItem, NoticeDetail } from '@/types/board'
import { Skeleton } from '@/components/ui/skeleton'
import TopButton from '@/components/common/TopButton'
import KakaoChannelAddButton from '@/components/common/KakaoChannelAddButton'
import WwwPagination from '@/components/common/WwwPagination'

const NOTICE_NAV_PAGE_SIZE = 500
/** 목록·상세 공통 본문 가로 최대 너비 */
const NOTICE_MAX_WIDTH_CLASS = 'max-w-[768px]'

/** 공지 상세 — 목록으로 (색·모양 통일) */
const NOTICE_BACK_TO_LIST_CLASS =
  'inline-flex items-center justify-center rounded-md bg-[#202020] px-4 py-2.5 text-[16px] font-bold leading-6 tracking-[-0.4px] text-white transition-opacity hover:opacity-90'

/** 목록용 YYYY.MM.DD */
function formatDateDot(s: string) {
  try {
    const d = new Date(s)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}.${m}.${day}`
  } catch {
    return s
  }
}

function NoticeInner() {
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const detailId = idParam ? Number(idParam) : null

  const [list, setList] = useState<NoticeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 20

  const [detail, setDetail] = useState<NoticeDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [noticeNeighbors, setNoticeNeighbors] = useState<{
    prev: { id: number; title: string } | null
    next: { id: number; title: string } | null
  }>({ prev: null, next: null })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchNotices({ page, page_size: pageSize })
      .then((res) => {
        if (!cancelled) {
          setList(Array.isArray(res.results) ? res.results : [])
          setTotalCount(typeof res.count === 'number' ? res.count : 0)
          setTotalPages(Math.ceil((typeof res.count === 'number' ? res.count : 0) / pageSize) || 1)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? '목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page])

  useEffect(() => {
    if (!detailId || Number.isNaN(detailId)) {
      setDetail(null)
      setDetailError(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    fetchNotice(detailId)
      .then((res) => {
        if (!cancelled) setDetail(res)
      })
      .catch((e) => {
        if (!cancelled) setDetailError(e?.message ?? '공지를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => { cancelled = true }
  }, [detailId])

  /** NO 컬럼 표시용 (고정 공지는 번호 소비 없음) */
  const noticeListRows = useMemo(() => {
    let n = totalCount - (page - 1) * pageSize
    return (list ?? []).map((row) => ({
      row,
      noLabel: row.is_pinned ? '공지' : String(n--),
    }))
  }, [list, totalCount, page, pageSize])

  /** 목록과 동일한 정렬 기준으로 이전/다음 글 (첫 페이지 최대 NOTICE_NAV_PAGE_SIZE개 기준) */
  useEffect(() => {
    if (!detailId || Number.isNaN(detailId)) {
      setNoticeNeighbors({ prev: null, next: null })
      return
    }
    let cancelled = false
    fetchNotices({ page: 1, page_size: NOTICE_NAV_PAGE_SIZE })
      .then((res) => {
        if (cancelled) return
        const results = Array.isArray(res.results) ? res.results : []
        const idx = results.findIndex((r) => r.id === detailId)
        if (idx === -1) {
          setNoticeNeighbors({ prev: null, next: null })
          return
        }
        setNoticeNeighbors({
          prev: idx > 0 ? { id: results[idx - 1].id, title: results[idx - 1].title } : null,
          next:
            idx < results.length - 1
              ? { id: results[idx + 1].id, title: results[idx + 1].title }
              : null,
        })
      })
      .catch(() => {
        if (!cancelled) setNoticeNeighbors({ prev: null, next: null })
      })
    return () => {
      cancelled = true
    }
  }, [detailId])

  if (detailId && !Number.isNaN(detailId)) {
    if (detailError) {
      return (
        <main className="min-h-screen bg-white font-sans">
          <div className={`mx-auto ${NOTICE_MAX_WIDTH_CLASS} px-4 sm:px-6 py-12`}>
            <div className="rounded-md bg-red-50 p-4 text-red-800">{detailError}</div>
            <div className="mt-8 flex justify-center">
              <Link href="/notice" className={NOTICE_BACK_TO_LIST_CLASS}>
                목록으로
              </Link>
            </div>
          </div>
        </main>
      )
    }
    return (
      <main className="min-h-screen bg-white font-sans">
        <div className={`mx-auto ${NOTICE_MAX_WIDTH_CLASS} px-4 sm:px-6 py-8 sm:py-12`}>
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full max-w-2xl" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : detail ? (
            <article>
              <header className="pb-6 border-b border-gray-200">
                <span className="inline-block rounded bg-[#E6FF00] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0f172a]">
                  NOTICE
                </span>
                <h1 className="mt-4 text-[28px] sm:text-[36px] font-bold leading-[40px] tracking-[-0.9px] text-[#202020]">
                  {detail.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-medium leading-5 tracking-normal text-[#444444]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0 text-[#444444]" strokeWidth={2} aria-hidden />
                    {formatDateDot(detail.created_at)}
                  </span>
                  <span className="text-[#444444]" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-4 w-4 shrink-0 text-[#444444]" strokeWidth={2} aria-hidden />
                    조회 {detail.view_count.toLocaleString('ko-KR')}
                  </span>
                </div>
              </header>

              <div
                className={`notice-detail-body pt-8 ${WWW_RICH_BODY_INNERHTML_BASE_CLASS}`}
                dangerouslySetInnerHTML={{ __html: detail.content }}
              />

              <nav
                className="mt-10 border-t border-gray-200 pt-0 text-[16px] font-normal leading-6 tracking-normal text-[#444444]"
                aria-label="이전·다음 글"
              >
                <div className="flex flex-col gap-0 border-b border-gray-200">
                  {noticeNeighbors.prev ? (
                    <Link
                      href={`/notice?id=${noticeNeighbors.prev.id}`}
                      className="flex w-full items-start justify-between gap-4 border-b border-gray-200 py-4 hover:opacity-80"
                    >
                      <span className="shrink-0 text-left">이전글</span>
                      <span className="min-w-0 flex-1 text-right line-clamp-2 break-words">
                        {noticeNeighbors.prev.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex w-full items-center justify-between gap-4 border-b border-gray-200 py-4 text-gray-400">
                      <span>이전글</span>
                      <span className="text-sm">이전 글이 없습니다.</span>
                    </div>
                  )}
                  {noticeNeighbors.next ? (
                    <Link
                      href={`/notice?id=${noticeNeighbors.next.id}`}
                      className="flex w-full items-start justify-between gap-4 py-4 hover:opacity-80"
                    >
                      <span className="shrink-0 text-left">다음글</span>
                      <span className="min-w-0 flex-1 text-right line-clamp-2 break-words">
                        {noticeNeighbors.next.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex w-full items-center justify-between gap-4 py-4 text-gray-400">
                      <span>다음글</span>
                      <span className="text-sm">다음 글이 없습니다.</span>
                    </div>
                  )}
                </div>
              </nav>

              <div className="mt-10 flex justify-center">
                <Link href="/notice" className={NOTICE_BACK_TO_LIST_CLASS}>
                  목록으로
                </Link>
              </div>
            </article>
          ) : null}
        </div>
        <TopButton />
        <KakaoChannelAddButton />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className={`mx-auto ${NOTICE_MAX_WIDTH_CLASS} px-4 sm:px-6 py-10 sm:py-14`}>
        <header className="text-left">
          <h1 className="text-4xl sm:text-[40px] font-black tracking-tight text-[#0f172a]">공지사항</h1>
          <p className="mt-3 text-lg text-gray-500">InDe 공지사항을 확인하세요.</p>
     
        </header>

        <div className="mt-10 sm:mt-12">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-none" />
              ))}
            </div>
          ) : noticeListRows.length === 0 ? (
            <p className="py-14 text-center text-[18px] font-medium leading-6 text-gray-500">등록된 공지가 없습니다.</p>
          ) : (
            <>
              {/* 모바일: 가로 스크롤 없음 — 제목 아래 줄에 조회수·날짜 오른쪽 정렬 */}
              <div className="md:hidden font-sans">
                <div className="flex border-b-2 border-[#0f172a] pb-3 pt-1">
                  <span className="w-11 shrink-0 text-left text-[14px] font-bold leading-5 tracking-[0.7px] text-[#0f172a] uppercase">
                    NO
                  </span>
                  <span className="min-w-0 flex-1 text-left text-[14px] font-bold leading-5 tracking-[0.7px] text-[#0f172a] uppercase">
                    제목
                  </span>
                </div>
                {noticeListRows.map(({ row, noLabel }) => (
                  <div key={row.id} className="border-b border-gray-200 py-3.5">
                    <div className="flex gap-2 items-start">
                      <div className="w-11 shrink-0 text-left text-[18px] font-medium leading-6 tracking-normal text-[#0f172a] tabular-nums">
                        {noLabel}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/notice?id=${row.id}`}
                          className="block text-left text-[18px] font-medium leading-6 tracking-normal text-[#0f172a] hover:underline break-words"
                        >
                          {row.title}
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-right text-[14px] font-medium leading-5 tracking-normal tabular-nums text-gray-700">
                          <span>조회 {row.view_count.toLocaleString('ko-KR')}</span>
                          <span className="whitespace-nowrap">{formatDateDot(row.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 데스크톱: 4열 테이블 */}
              <div className="hidden md:block">
                <table className="w-full border-collapse font-sans">
                  <thead>
                    <tr className="border-b-2 border-[#0f172a]">
                      <th
                        scope="col"
                        className="w-[72px] pb-3 pt-1 text-left align-middle text-[14px] font-bold leading-5 tracking-[0.7px] text-[#0f172a] uppercase"
                      >
                        NO
                      </th>
                      <th
                        scope="col"
                        className="pb-3 pt-1 text-left align-middle text-[14px] font-bold leading-5 tracking-[0.7px] text-[#0f172a] uppercase"
                      >
                        제목
                      </th>
                      <th
                        scope="col"
                        className="w-[100px] pb-3 pt-1 text-right align-middle text-[14px] font-bold leading-5 tracking-[0.7px] text-[#0f172a] uppercase"
                      >
                        조회수
                      </th>
                      <th
                        scope="col"
                        className="w-[120px] pb-3 pt-1 text-right align-middle text-[14px] font-bold leading-5 tracking-[0.7px] text-[#0f172a] whitespace-nowrap uppercase"
                      >
                        날짜
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {noticeListRows.map(({ row, noLabel }) => (
                      <tr key={row.id} className="border-b border-gray-200">
                        <td className="py-3.5 pr-2 align-middle text-[18px] font-medium leading-6 tracking-normal text-[#0f172a]">
                          <span className="tabular-nums">{noLabel}</span>
                        </td>
                        <td className="py-3.5 pr-3 align-middle text-[18px] font-medium leading-6 tracking-normal">
                          <Link
                            href={`/notice?id=${row.id}`}
                            className="text-left text-[#0f172a] hover:underline"
                          >
                            {row.title}
                          </Link>
                        </td>
                        <td className="py-3.5 text-right align-middle text-[18px] font-medium leading-6 tracking-normal tabular-nums text-gray-700">
                          {row.view_count.toLocaleString('ko-KR')}
                        </td>
                        <td className="py-3.5 text-right align-middle text-[18px] font-medium leading-6 tracking-normal tabular-nums text-gray-700 whitespace-nowrap">
                          {formatDateDot(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <WwwPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                variant="simple"
                maxVisiblePages={5}
                className="mt-10"
              />
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function NoticePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">로딩 중…</p>
      </main>
    }>
      <NoticeInner />
    </Suspense>
  )
}

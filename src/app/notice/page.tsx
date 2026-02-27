'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { fetchNotices, fetchNotice } from '@/services/board'
import type { NoticeListItem, NoticeDetail } from '@/types/board'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import Footer from '@/components/layout/Footer'

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return s;
  }
}

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
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

  if (detailId && !Number.isNaN(detailId)) {
    if (detailError) {
      return (
        <main className="min-h-screen bg-white">
          <div className="mx-auto max-w-[1220px] px-4 py-12">
            <div className="rounded-md bg-red-50 p-4 text-red-800">{detailError}</div>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/notice">목록으로</Link>
            </Button>
          </div>
          <Footer />
        </main>
      )
    }
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 py-8 sm:py-12">
          <div className="mb-4">
            <Link href="/notice" className="text-sm text-gray-500 hover:text-gray-900">
              ← 공지사항 목록
            </Link>
          </div>
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : detail ? (
            <Card className="overflow-hidden">
              <CardHeader className="space-y-3 pb-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                  {detail.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    조회 {detail.view_count}
                  </Badge>
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {formatDateTime(detail.created_at)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="border-t border-border pt-6">
                <div
                  className="prose prose-gray max-w-none text-gray-700 whitespace-pre-line break-keep text-[15px] leading-[1.7] prose-p:my-3 first:prose-p:mt-0 last:prose-p:mb-0"
                  dangerouslySetInnerHTML={{ __html: detail.content }}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 py-8 sm:py-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">공지사항</h1>
          <p className="mt-1 text-sm text-gray-500">InDe 공지사항을 확인하세요.</p>
        </div>

        <Card className="mt-6">
          <CardContent>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px] text-center">번호</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead className="w-[90px] text-center">조회수</TableHead>
                      <TableHead className="w-[120px] min-w-[120px] text-right whitespace-nowrap">날짜</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(list ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          등록된 공지가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (list ?? []).map((row, index) => {
                        const rowNum = totalCount - (page - 1) * pageSize - index
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="text-center text-gray-500">
                              {rowNum}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/notice?id=${row.id}`}
                                className="font-medium text-gray-900 hover:underline"
                              >
                                {row.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center text-gray-500">
                              {row.view_count}
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm text-right whitespace-nowrap w-[120px] min-w-[120px]">
                              {formatDate(row.created_at)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      이전
                    </Button>
                    <span className="text-sm text-gray-600">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
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

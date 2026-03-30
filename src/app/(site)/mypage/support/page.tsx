'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fetchInquiry, fetchInquiries } from '@/services/board'
import type { InquiryDetail, InquiryListItem } from '@/types/board'
import { getSysCode, getSysCodeName, INQUIRY_TYPE_PARENT, type SysCodeItem } from '@/lib/syscode'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
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
import { getAccessToken } from '@/services/auth'
import {
  formatInquiryDate,
  formatInquiryDateTime,
  inquiryErrorMessage,
  InquiryAttachmentBlock,
} from './_components/inquiryShared'

const pageSize = 20

function MypageSupportInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const detailId = idParam ? Number(idParam) : null

  const [list, setList] = useState<InquiryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [typeSysCodes, setTypeSysCodes] = useState<SysCodeItem[]>([])

  const [detail, setDetail] = useState<InquiryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getSysCode(INQUIRY_TYPE_PARENT).then((rows) => {
      if (!cancelled) setTypeSysCodes(rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!getAccessToken()) {
      router.replace('/login?next=/mypage/support')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchInquiries({ page, page_size: pageSize })
      .then((res) => {
        if (!cancelled) {
          setList(Array.isArray(res.results) ? res.results : [])
          const cnt = typeof res.count === 'number' ? res.count : 0
          setTotalPages(Math.ceil(cnt / pageSize) || 1)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e?.response?.status === 401) router.replace('/login?next=/mypage/support')
          else setError(inquiryErrorMessage(e, '목록을 불러오지 못했습니다.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, router])

  useEffect(() => {
    if (!detailId || Number.isNaN(detailId)) {
      setDetail(null)
      setDetailError(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    fetchInquiry(detailId)
      .then((res) => {
        if (!cancelled) setDetail(res)
      })
      .catch((e) => {
        if (!cancelled) {
          if (e?.response?.status === 401) router.replace('/login?next=/mypage/support')
          else setDetailError(inquiryErrorMessage(e, '문의를 불러오지 못했습니다.'))
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [detailId, router])

  if (detailId && !Number.isNaN(detailId)) {
    if (detailError) {
      return (
        <div>
          <div className="mb-6">
            <Link href="/mypage/support" className="text-sm text-[#6b7280] hover:text-[#111827]">
              ← 목록으로
            </Link>
          </div>
          <div className="rounded-md bg-red-50 p-4 text-red-800">{detailError}</div>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/mypage/support">목록으로</Link>
          </Button>
        </div>
      )
    }

    return (
      <div>
        <div className="mb-6">
          <Link href="/mypage/support" className="text-sm text-[#6b7280] hover:text-[#111827]">
            ← 목록으로
          </Link>
        </div>
        {detailLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail ? (
          <Card className="rounded-xl border border-[#e5e7eb] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-gray-900">{detail.title}</h2>
                <Badge variant={detail.status === 'answered' ? 'answered' : 'waiting'}>
                  {detail.status === 'answered' ? '답변완료' : '접수'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">{formatInquiryDateTime(detail.created_at)}</p>
              <p className="text-sm text-gray-600">
                문의 유형:{' '}
                <span className="font-medium text-gray-900">
                  {getSysCodeName(typeSysCodes, detail.inquiry_type)}
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.attachment ? <InquiryAttachmentBlock url={detail.attachment} /> : null}
              <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-gray-700">{detail.content}</div>
              {detail.answer ? (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="mb-1 text-sm font-medium text-green-800">관리자 답변</p>
                  <div
                    className="whitespace-pre-wrap text-gray-700"
                    dangerouslySetInnerHTML={{ __html: detail.answer }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div>
            <p className="text-gray-500">문의를 찾을 수 없습니다.</p>
            <Link href="/mypage/support" className="mt-4 inline-block text-sm text-blue-600 underline">
              목록으로
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[16px] leading-6 text-[#6b7280]">내 문의만 표시됩니다.</p>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/mypage/support/write">1:1 문의하기</Link>
        </Button>
      </div>

      <Card className="rounded-xl border border-[#e5e7eb] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <CardContent>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
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
                    <TableHead>제목</TableHead>
                    <TableHead className="w-[120px] min-w-[100px]">유형</TableHead>
                    <TableHead className="w-[100px]">상태</TableHead>
                    <TableHead className="w-[100px]">날짜</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                        문의 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (list ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            href={`/mypage/support?id=${row.id}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {row.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {getSysCodeName(typeSysCodes, row.inquiry_type)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'answered' ? 'answered' : 'waiting'}>
                            {row.status === 'answered' ? '답변완료' : '접수'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatInquiryDate(row.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
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
  )
}

export default function MypageSupportPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      }
    >
      <MypageSupportInner />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fetchInquiries, fetchInquiry, answerInquiry } from '@/services/board'
import { getUserInfo } from '@/services/auth'
import type { InquiryListItem, InquiryDetail } from '@/types/board'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { getAccessToken } from '@/services/auth'

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

function InquiryListInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const detailId = idParam ? Number(idParam) : null

  const [list, setList] = useState<InquiryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 20

  const [detail, setDetail] = useState<InquiryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)

  const userInfo = typeof window !== 'undefined' ? getUserInfo() : null
  const isStaff = Boolean((userInfo as { is_staff?: boolean } | null)?.is_staff)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!getAccessToken()) {
      router.replace('/login?next=/inquiry')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchInquiries({ page, page_size: pageSize })
      .then((res) => {
        if (!cancelled) {
          setList(Array.isArray(res.results) ? res.results : [])
          setTotalCount(typeof res.count === 'number' ? res.count : 0)
          setTotalPages(Math.ceil((typeof res.count === 'number' ? res.count : 0) / pageSize) || 1)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e?.response?.status === 401) router.replace('/login?next=/inquiry')
          else setError(e?.message ?? '목록을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
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
        if (!cancelled) {
          setDetail(res)
          setAnswerText(res.answer ?? '')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e?.response?.status === 401) router.replace('/login?next=/inquiry')
          else setDetailError(e?.message ?? '문의를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => { cancelled = true }
  }, [detailId, router])

  const handleSubmitAnswer = async () => {
    if (!detailId || !answerText.trim()) return
    setAnswerError(null)
    setSubmitting(true)
    try {
      const updated = await answerInquiry(detailId, answerText.trim())
      setDetail(updated)
    } catch (e: unknown) {
      const err = e as { response?: { status: number }; message?: string }
      if (err.response?.status === 401) router.replace('/login')
      else setAnswerError((err?.message as string) ?? '답변 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (detailId && !Number.isNaN(detailId)) {
    if (detailError) {
      return (
        <main className="min-h-screen bg-white">
          <div className="mx-auto max-w-[720px] px-4 py-12">
            <div className="rounded-md bg-red-50 p-4 text-red-800">{detailError}</div>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/inquiry">목록으로</Link>
            </Button>
          </div>
          <Footer />
        </main>
      )
    }
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-8 sm:py-12">
          <div className="mb-4">
            <Link href="/inquiry" className="text-sm text-gray-500 hover:text-gray-900">
              ← 문의 목록
            </Link>
          </div>
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detail ? (
            <>
              <Card>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-xl font-bold text-gray-900">{detail.title}</h1>
                    <Badge variant={detail.status === 'answered' ? 'answered' : 'waiting'}>
                      {detail.status === 'answered' ? '답변완료' : '접수'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{formatDateTime(detail.created_at)}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-gray-50 p-4 text-gray-700 whitespace-pre-wrap">
                    {detail.content}
                  </div>
                  {detail.answer && (
                    <div className="rounded-md bg-green-50 p-4">
                      <p className="text-sm font-medium text-green-800 mb-1">관리자 답변</p>
                      <div
                        className="text-gray-700 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: detail.answer }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              {isStaff && (
                <Card className="mt-6">
                  <CardHeader className="pb-2">
                    <h2 className="text-lg font-semibold">관리자 답변 작성</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {answerError && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                        {answerError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="answer">답변 내용</Label>
                      <textarea
                        id="answer"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        rows={6}
                        placeholder="답변을 입력하세요."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                    <Button onClick={handleSubmitAnswer} disabled={submitting}>
                      {submitting ? '저장 중…' : '답변 저장'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">1:1 문의</h1>
            <p className="mt-1 text-sm text-gray-500">문의 내역을 확인하세요.</p>
          </div>
          <Button asChild>
            <Link href="/inquiry/write">문의하기</Link>
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">내 문의</CardTitle>
          </CardHeader>
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
                      <TableHead>제목</TableHead>
                      <TableHead className="w-[100px]">상태</TableHead>
                      <TableHead className="w-[100px]">날짜</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(list ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                          문의 내역이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (list ?? []).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Link
                              href={`/inquiry?id=${row.id}`}
                              className="font-medium text-gray-900 hover:underline"
                            >
                              {row.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.status === 'answered' ? 'answered' : 'waiting'}>
                              {row.status === 'answered' ? '답변완료' : '접수'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {formatDate(row.created_at)}
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
      <Footer />
    </main>
  )
}

export default function InquiryPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">로딩 중…</p>
      </main>
    }>
      <InquiryListInner />
    </Suspense>
  )
}

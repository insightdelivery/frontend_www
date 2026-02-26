'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createNotice } from '@/services/board'
import { getUserInfo } from '@/services/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RichTextEditor from '@/components/editor/RichTextEditor'
import Footer from '@/components/layout/Footer'

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(255, '제목은 255자 이내로 입력하세요.'),
  content: z.string().min(1, '내용을 입력하세요.'),
  is_pinned: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export default function NoticeWritePage() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const userInfo = typeof window !== 'undefined' ? getUserInfo() : null
  const isStaff = Boolean(userInfo?.is_staff)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '', is_pinned: false },
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    setAuthChecked(true)
    if (!userInfo?.is_staff) {
      router.replace('/notice')
    }
  }, [router, userInfo?.is_staff])

  useEffect(() => {
    setValue('content', htmlContent, { shouldValidate: true })
  }, [htmlContent, setValue])

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      const created = await createNotice({
        title: data.title,
        content: htmlContent || data.content,
        is_pinned: data.is_pinned,
      })
      router.push(`/notice?id=${created.id}`)
    } catch (e: unknown) {
      const err = e as { response?: { status: number }; message?: string }
      if (err.response?.status === 401) router.replace('/login')
      else setSubmitError((err?.message as string) ?? '공지 등록에 실패했습니다.')
    }
  }

  if (!authChecked || !isStaff) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[720px] px-4 py-12">
          <p className="text-gray-500">권한을 확인하는 중…</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-4">
          <Link href="/notice" className="text-sm text-gray-500 hover:text-gray-900">
            ← 공지사항 목록
          </Link>
        </div>
        <h1 className="text-2xl font-black text-gray-900">공지 작성</h1>
        <p className="mt-1 text-sm text-gray-500">관리자만 작성할 수 있습니다.</p>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">새 공지</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {submitError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {submitError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="제목 (1~255자)"
                  maxLength={255}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>내용 (HTML)</Label>
                <RichTextEditor
                  content={htmlContent}
                  onChange={(html) => {
                    setHtmlContent(html)
                    setValue('content', html, { shouldValidate: true })
                  }}
                  placeholder="내용을 입력하세요."
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  {...register('is_pinned')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_pinned" className="font-normal">
                  상단 고정
                </Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '등록 중…' : '등록'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/notice">취소</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </main>
  )
}

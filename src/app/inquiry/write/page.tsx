'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createInquiry } from '@/services/board'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/layout/Footer'
import { getAccessToken } from '@/services/auth'
import { useEffect } from 'react'

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(255, '제목은 255자 이내로 입력하세요.'),
  content: z.string().min(1, '내용을 입력하세요.'),
})

type FormData = z.infer<typeof schema>

/** 403/401 시 API Message 또는 친절한 문구 반환 (raw status 메시지 노출 방지) */
function inquiryErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { status: number; data?: { Message?: string } }; message?: string }
  if (err?.response?.status === 401 || err?.response?.status === 403) {
    const msg = err?.response?.data?.Message?.trim()
    return msg || '로그인이 필요하거나 권한이 없습니다. 다시 로그인해 주세요.'
  }
  return err?.message ?? fallback
}

export default function InquiryWritePage() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '' },
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && !getAccessToken()) {
      router.replace('/login?next=/inquiry/write')
    }
  }, [router])

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      const created = await createInquiry({ title: data.title, content: data.content })
      router.push(`/inquiry?id=${created.id}`)
    } catch (e: unknown) {
      const err = e as { response?: { status: number }; message?: string }
      if (err.response?.status === 401) router.replace('/login?next=/inquiry/write')
      else setSubmitError(inquiryErrorMessage(e, '문의 등록에 실패했습니다.'))
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-4">
          <Link href="/inquiry" className="text-sm text-gray-500 hover:text-gray-900">
            ← 문의 목록
          </Link>
        </div>
        <h1 className="text-2xl font-black text-gray-900">1:1 문의하기</h1>
        <p className="mt-1 text-sm text-gray-500">문의 내용을 입력해 주세요.</p>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">문의 작성</CardTitle>
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
                  placeholder="제목을 입력하세요 (1~255자)"
                  maxLength={255}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <textarea
                  id="content"
                  {...register('content')}
                  rows={8}
                  placeholder="문의 내용을 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '등록 중…' : '등록'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/inquiry">취소</Link>
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

'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * 예전 /inquiry, /inquiry?id= 경로 → 마이페이지 1:1 문의로 이동
 */
function InquiryLegacyRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  useEffect(() => {
    if (id) {
      const n = Number(id)
      if (!Number.isNaN(n)) {
        router.replace(`/mypage/support?id=${n}`)
        return
      }
    }
    router.replace('/mypage/support')
  }, [id, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-gray-500">이동 중…</p>
    </main>
  )
}

export default function InquiryLegacyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-gray-500">로딩 중…</p>
        </main>
      }
    >
      <InquiryLegacyRedirectInner />
    </Suspense>
  )
}

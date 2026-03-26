'use client'

/**
 * `/s?code=` — 정적 export·단일 HTML에 유리한 진입점
 */
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ShortShareRedirectClient from '@/components/share/ShortShareRedirectClient'

function ShortFromQueryInner() {
  const searchParams = useSearchParams()
  const code =
    (searchParams.get('code') ?? searchParams.get('c') ?? '').trim()
  return <ShortShareRedirectClient code={code} />
}

export default function ShortShareQueryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-white px-4">
          <p className="text-[16px] text-[#64748b]">이동 중…</p>
        </main>
      }
    >
      <ShortFromQueryInner />
    </Suspense>
  )
}

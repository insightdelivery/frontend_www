import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildShortShareMetadata } from '@/lib/seo/buildDetailMetadata'
import ShortSharePageClient from './ShortSharePageClient'

type PageProps = {
  searchParams: Promise<{
    code?: string
    c?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const code = (sp.code ?? sp.c ?? '').trim()
  return buildShortShareMetadata(code)
}

export default async function ShortShareQueryPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const code = (sp.code ?? sp.c ?? '').trim()

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white px-4">
          <p className="text-[16px] text-[#64748b]">이동 중…</p>
        </main>
      }
    >
      <ShortSharePageClient code={code} />
    </Suspense>
  )
}

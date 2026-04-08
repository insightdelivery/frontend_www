'use client'

import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { buildLoginHrefFromParts } from '@/lib/postLoginRedirect'

/** 현재 URL을 `next`로 넣은 `/login?next=...` — Suspense 경계 안에서 사용 */
export function useLoginHref(): string {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return useMemo(
    () => buildLoginHrefFromParts(pathname, searchParams.toString()),
    [pathname, searchParams]
  )
}

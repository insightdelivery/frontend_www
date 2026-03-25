import { cache } from 'react'
import type { HomepageDocPayload, HomepageDocType } from '@/types/homepageDoc'

function getServerApiBase(): string {
  const env = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  if (env) return env
  if (process.env.NODE_ENV === 'development') return 'http://localhost:8001'
  return 'https://api.inde.kr'
}

function unwrapInde<T>(data: unknown): T {
  const d = data as { IndeAPIResponse?: { ErrorCode?: string; Result?: T } }
  const api = d?.IndeAPIResponse
  if (!api || api.ErrorCode !== '00') {
    return undefined as T
  }
  return api.Result as T
}

async function fetchPublicHomepageDocImpl(docType: HomepageDocType): Promise<HomepageDocPayload | null> {
  const base = getServerApiBase()
  const url = `${base}/api/homepage-docs/${docType}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (res.status === 404) return null
  if (!res.ok) return null
  const json = await res.json()
  const doc = unwrapInde<HomepageDocPayload>(json)
  return doc ?? null
}

/** 공개 GET — generateMetadata + 페이지에서 중복 호출 시 1회만 fetch */
export const fetchPublicHomepageDoc = cache(fetchPublicHomepageDocImpl)

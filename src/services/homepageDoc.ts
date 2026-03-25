import { cache } from 'react'
import type { HomepageDocPayload, HomepageDocType } from '@/types/homepageDoc'

export function getServerApiBase(): string {
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

async function fetchPublicHomepageDocWithRevalidate(
  docType: HomepageDocType,
  revalidate: number | false
): Promise<HomepageDocPayload | null> {
  const base = getServerApiBase()
  const url = `${base}/api/homepage-docs/${docType}`
  const res = await fetch(url, { next: { revalidate } })
  if (res.status === 404) return null
  if (!res.ok) return null
  const json = await res.json()
  const doc = unwrapInde<HomepageDocPayload>(json)
  return doc ?? null
}

async function fetchPublicHomepageDocImpl(docType: HomepageDocType): Promise<HomepageDocPayload | null> {
  return fetchPublicHomepageDocWithRevalidate(docType, 0)
}

/** 공개 GET — generateMetadata + 페이지에서 중복 호출 시 1회만 fetch */
export const fetchPublicHomepageDoc = cache(fetchPublicHomepageDocImpl)

/**
 * 빌드 타임 정적 페이지용(회사소개·약관·개인정보). `output: 'export'` 시 HTML에 박음.
 * 런타임 ISR 없음 — 재배포로 내용 갱신.
 */
export const fetchPublicHomepageDocAtBuild = cache(async (docType: HomepageDocType) =>
  fetchPublicHomepageDocWithRevalidate(docType, false)
)

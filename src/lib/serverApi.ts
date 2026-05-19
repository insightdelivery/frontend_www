/**
 * Server Component / generateMetadata 전용 공개 API fetch.
 * axios(쿠키·클라이언트 인터셉터) 대신 fetch로 백엔드 JSON을 직접 조회한다.
 */

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d && typeof d === 'object' && 'Result' in d && (d as { Result?: unknown }).Result !== undefined) {
    return (d as { Result: T }).Result
  }
  return data as T
}

/** SSR·generateMetadata에서 사용할 공개 API 베이스 URL */
export function getServerApiBaseUrl(): string {
  const fromServer =
    (process.env.INDE_API_SERVER_URL || process.env.API_SERVER_URL || '').trim().replace(/\/$/, '')
  if (fromServer) return fromServer

  const fromPublic = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '')
  if (fromPublic) return fromPublic

  if (process.env.NODE_ENV === 'development') {
    return (process.env.INDE_PUBLIC_API_PROXY_TARGET || 'http://127.0.0.1:8001').replace(/\/$/, '')
  }

  return 'https://api.inde.kr'
}

export async function serverFetchPublicJson<T>(
  path: string,
  options?: { revalidate?: number },
): Promise<T> {
  const base = getServerApiBaseUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${normalized}`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: options?.revalidate ?? 60 },
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${url}`)
  }

  const data = (await res.json()) as unknown
  return unwrapResult<T>(data)
}

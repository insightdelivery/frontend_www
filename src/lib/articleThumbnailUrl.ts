import { getApiBaseURL } from '@/lib/axios'

/**
 * 아티클 썸네일 URL을 img src에 안전하게 쓸 수 있게 정규화한다.
 * - 백엔드가 presigned 전체 URL을 주면 그대로 사용.
 * - `/api/...` 등 **상대 경로**만 오는 경우(www와 API 호스트 분리) 브라우저가 잘못된 호스트로 요청하지 않도록 `NEXT_PUBLIC_API_URL` 기준 절대 URL로 만든다.
 * - `list.md` §3.1·§8 / 비디오 `resolveThumbnailUrl`과 동일 패턴.
 */
export function resolveArticleThumbnailUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const u = url.trim()
  if (u.startsWith('data:image')) return u
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return u
  if (u.startsWith('/')) {
    const base = getApiBaseURL().replace(/\/$/, '')
    return `${base}${u}`
  }
  return u
}

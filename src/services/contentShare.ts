/**
 * 회원 short 공유 링크 — contentShareLinkCopy.md
 */
import apiClient from '@/lib/axios'

const INDERESULT = 'IndeAPIResponse'
const RESULT = 'Result'

function unwrap<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  const wrap = d?.[INDERESULT] as Record<string, unknown> | undefined
  if (wrap && typeof wrap[RESULT] !== 'undefined') return wrap[RESULT] as T
  if (typeof d?.[RESULT] !== 'undefined') return d[RESULT] as T
  return d as T
}

function getMessage(data: unknown): string {
  const d = data as Record<string, unknown>
  const wrap = d?.[INDERESULT] as { Message?: string } | undefined
  return wrap?.Message ?? (d as { message?: string }).message ?? '처리 중 오류가 발생했습니다.'
}

export type ShareEnsureMode = 'active' | 'issued' | 'renewed'

export interface ShareEnsureResult {
  mode: ShareEnsureMode
  shortCode: string
  expiredAt: string
}

/** POST /api/library/content-share/ensure — §5.3 */
export async function ensureShareLink(
  contentType: 'ARTICLE' | 'VIDEO' | 'SEMINAR',
  contentCode: string
): Promise<ShareEnsureResult> {
  const res = await apiClient.post('/api/library/content-share/ensure', {
    contentType,
    contentCode,
  })
  const out = unwrap<ShareEnsureResult>(res.data)
  if (!out?.shortCode || !out?.expiredAt) throw new Error(getMessage(res.data))
  return out
}

export interface ShareResolveResult {
  contentType: string
  contentId: number
  expired: boolean
}

/** GET /api/library/content-share/resolve — short → 콘텐츠 (쿠키 없음) */
export async function resolveShareShortCode(shortCode: string): Promise<ShareResolveResult> {
  const res = await apiClient.get('/api/library/content-share/resolve', {
    params: { shortCode },
  })
  const out = unwrap<ShareResolveResult>(res.data)
  if (out?.contentId == null || !out?.contentType) throw new Error(getMessage(res.data))
  return out
}

/**
 * GET /api/library/content-share/visit — short 유효 시 share_access(share_token) HttpOnly 쿠키 설정(§10)
 * withCredentials: axios 기본 사용
 */
export async function visitShareShortCode(shortCode: string): Promise<ShareResolveResult> {
  const res = await apiClient.get('/api/library/content-share/visit', {
    params: { shortCode },
  })
  const out = unwrap<ShareResolveResult>(res.data)
  if (out?.contentId == null || !out?.contentType) throw new Error(getMessage(res.data))
  return out
}

export interface ShareForCopyResult {
  eligible: boolean
  reason?: string
  shortCode?: string
}

/**
 * GET /api/library/content-share/for-copy — §10.16 share_token 검증 후 short_code만 (쿠키 전송)
 */
export async function fetchShareForCopy(
  contentType: 'ARTICLE' | 'VIDEO' | 'SEMINAR',
  contentCode: string
): Promise<ShareForCopyResult> {
  const res = await apiClient.get('/api/library/content-share/for-copy', {
    params: { contentType, contentCode },
  })
  return unwrap<ShareForCopyResult>(res.data)
}

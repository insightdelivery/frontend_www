import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'
import {
  clearMemoryAccessToken,
  getMemoryAccessToken,
  setMemoryAccessToken,
} from '@/lib/accessTokenMemory'

// 로컬 개발 시 기본값: localhost:8001 (공개 API), 프로덕션: api.inde.kr
export const getApiBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return 'http://localhost:8001'
  }
  return 'https://api.inde.kr'
}

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

const pathOnly = (url?: string) => {
  if (!url) return ''
  return url.replace(getApiBaseURL(), '').split('?')[0].replace(/^https?:\/\/[^/]+/, '') || url
}

const normalizeApiPath = (path: string) => {
  const p = path.split('?')[0] || ''
  if (!p) return ''
  return p.startsWith('/') ? p : `/${p}`
}

const resolveRequestPath = (config: InternalAxiosRequestConfig): string => {
  const raw = config.url || ''
  const base = (config.baseURL || '').replace(/\/$/, '')
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return normalizeApiPath(pathOnly(raw))
  }
  const combined = base ? `${base}${raw.startsWith('/') ? raw : raw ? `/${raw}` : ''}` : raw
  return normalizeApiPath(pathOnly(combined) || (raw ? normalizeApiPath(raw) : ''))
}

const isPublicBoard = (url?: string) => {
  const path = pathOnly(url)
  return /^\/api\/(notices|faqs|articles|content|events|videos|search|homepage-docs|library)(\/|$)/.test(
    path
  )
}

const isPublicSyscodePath = (url?: string) => {
  const path = pathOnly(url)
  return /^\/systemmanage\/syscode(\/|$)/.test(path)
}

const isLibraryMemberEndpoint = (config: InternalAxiosRequestConfig) => {
  const path = resolveRequestPath(config)
  const m = String(config.method || 'get').toLowerCase()
  if (m === 'post' && /^\/api\/library\/content-share\/ensure\/?$/.test(path)) return true
  if (m === 'post' && /^\/api\/library\/useractivity\/rating\/?$/.test(path)) return true
  if ((m === 'post' || m === 'delete') && /^\/api\/library\/useractivity\/bookmark\/?$/.test(path)) return true
  if (m === 'get' && /^\/api\/library\/useractivity\/me\//.test(path)) return true
  return false
}

const isArticleDetailGet = (config: InternalAxiosRequestConfig) => {
  if (String(config.method || 'get').toLowerCase() !== 'get') return false
  const path = resolveRequestPath(config)
  return /^\/api\/articles\/\d+\/?$/.test(path)
}

const isContentQuestionAnswerPost = (config: InternalAxiosRequestConfig) => {
  const path = resolveRequestPath(config)
  const m = String(config.method || 'get').toLowerCase()
  return m === 'post' && /^\/api\/content\/question-answer\/?$/.test(path)
}

/** 마이페이지 적용질문 목록 — 로그인 필요 (isPublicBoard 예외) */
const isContentMyAnsweredContentsGet = (config: InternalAxiosRequestConfig) => {
  if (String(config.method || 'get').toLowerCase() !== 'get') return false
  const path = resolveRequestPath(config)
  return /^\/api\/content\/my-answered-contents\/?$/i.test(path)
}

/** 콘텐츠별 내 답변 목록 — 로그인 필요 */
const isContentMyAnswersGet = (config: InternalAxiosRequestConfig) => {
  if (String(config.method || 'get').toLowerCase() !== 'get') return false
  const path = resolveRequestPath(config)
  return /^\/api\/content\/(ARTICLE|VIDEO|SEMINAR)\/\d+\/my-answers\/?$/i.test(path)
}

/** /api/content/ 이지만 401 시 refresh·재시도 대상 (frontend_wwwRules.md §5·§8) */
function isAuthRequiredContentPath(path: string): boolean {
  return (
    /^\/api\/content\/my-answered-contents\/?$/i.test(path) ||
    /^\/api\/content\/(ARTICLE|VIDEO|SEMINAR)\/\d+\/my-answers\/?$/i.test(path)
  )
}

const isPublicAuthFlow = (url?: string) => {
  const path = pathOnly(url)
  return /^\/auth\/(send-sms|verify-sms|register|login|send-sms-find-id|find-id|send-password-reset-code|verify-password-reset-code|reset-password)(\/|$)/i.test(
    path
  )
}

/** frontend_wwwRules.md — tokenrefresh는 인터셉터 ensureToken·401-refresh 재시도 대상에서 제외 */
const isTokenRefreshPath = (path: string) => /^\/auth\/tokenrefresh\/?$/i.test(path)

/** 로그아웃 등 — ensureToken 생략 */
const skipsRequestEnsureToken = (path: string) =>
  isTokenRefreshPath(path) || /^\/auth\/logout\/?$/i.test(path)

/** 401 수신 시 refresh 후 재시도하지 않는 경로(무한 루프·불필요 갱신 방지) */
const skips401RefreshRetry = (path: string) =>
  isTokenRefreshPath(path) ||
  /^\/auth\/logout\/?$/i.test(path) ||
  (isPublicBoard(path) && !isAuthRequiredContentPath(path)) ||
  isPublicSyscodePath(path) ||
  isPublicAuthFlow(path)

let isAuthFailHandled = false

export function resetAuthFailHandled(): void {
  isAuthFailHandled = false
}

export function handleAuthFail(): void {
  if (isAuthFailHandled) return
  isAuthFailHandled = true
  clearMemoryAccessToken()
  Cookies.remove('userInfo', { path: '/' })
  Cookies.remove('accessToken', { path: '/' })
  Cookies.remove('refreshToken', { path: '/' })
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login?error=UNAUTHORIZED')
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    if (typeof atob === 'undefined') return true
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as { exp?: number }
    const exp = payload.exp
    if (exp == null) return true
    const now = Math.floor(Date.now() / 1000)
    return exp - 60 <= now
  } catch {
    return true
  }
}

type TokenRefreshPayload = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: Record<string, unknown>
}

/**
 * public_api는 core.renderers.IndeJSONRenderer 로 평면 JSON이
 * `{ IndeAPIResponse: { ErrorCode, Message, Result: { access_token, ... } } }` 로 감싸진다.
 */
function parseTokenRefreshResponseBody(raw: unknown): TokenRefreshPayload {
  if (raw !== null && typeof raw === 'object') {
    const d = raw as Record<string, unknown>
    const inde = d.IndeAPIResponse
    if (inde && typeof inde === 'object' && inde !== null) {
      const api = inde as { ErrorCode?: string; Message?: string; Result?: unknown }
      if (api.ErrorCode && api.ErrorCode !== '00') {
        throw new Error(api.Message || '토큰 갱신에 실패했습니다.')
      }
      const r = api.Result
      if (r && typeof r === 'object' && r !== null) {
        const result = r as TokenRefreshPayload
        if (result.access_token) return result
      }
    }
    if ('Result' in d && d.Result && typeof d.Result === 'object' && d.Result !== null) {
      const result = d.Result as TokenRefreshPayload
      if (result.access_token) return result
    }
    const flat = raw as TokenRefreshPayload
    if (flat.access_token) return flat
  }
  throw new Error('토큰 갱신 응답에 access_token이 없습니다.')
}

/** raw axios만 — apiClient 인터셉터 미적용(규칙: refresh에 재귀 호출 금지) */
async function postTokenRefreshRequest(): Promise<unknown> {
  const baseURL = getApiBaseURL()
  const response = await axios.post(`${baseURL}/auth/tokenrefresh`, {}, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })
  return response.data
}

function applyTokenRefreshPayload(data: TokenRefreshPayload): string {
  const newAccessToken = data?.access_token
  if (!newAccessToken) throw new Error('토큰 갱신 응답에 access_token이 없습니다.')
  setMemoryAccessToken(newAccessToken)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console -- 로컬에서 갱신 후 access 확인용
    console.log('[auth] accessToken (after refresh)', newAccessToken)
  }
  if (data?.user) {
    Cookies.set('userInfo', JSON.stringify(data.user), {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
  }
  return newAccessToken
}

/**
 * POST /auth/tokenrefresh 단일 시도.
 * 401·403 → refresh 무효로 보고 즉시 handleAuthFail (frontend_wwwRules.md §7).
 */
async function executeTokenRefreshOnce(): Promise<string> {
  try {
    const raw = await postTokenRefreshRequest()
    const data = parseTokenRefreshResponseBody(raw)
    return applyTokenRefreshPayload(data)
  } catch (err) {
    const ax = err as AxiosError
    const st = ax.response?.status
    if (st === 401 || st === 403) {
      handleAuthFail()
    }
    throw err
  }
}

/** 동시 다발 401·ensureToken 갱신 — refresh는 반드시 1회만 실행, 나머지는 대기 (§8) */
let sharedRefreshPromise: Promise<string> | null = null

function runRefreshDeduped(): Promise<string> {
  if (!sharedRefreshPromise) {
    sharedRefreshPromise = executeTokenRefreshOnce().finally(() => {
      sharedRefreshPromise = null
    })
  }
  return sharedRefreshPromise
}

type EnsureTokenMode = 'strict' | 'lenient'

async function ensureToken(mode: EnsureTokenMode): Promise<void> {
  if (typeof window === 'undefined') return
  let token = getMemoryAccessToken()

  if (!token) {
    if (mode === 'lenient' && !Cookies.get('userInfo')) return
    await runRefreshDeduped()
    return
  }
  if (!isTokenExpired(token)) return

  await runRefreshDeduped()
}

/** initAuth — userInfo 있을 때만 조용히 1회 (비로그인은 refresh 호출 안 함) */
export async function restoreSessionTokens(): Promise<void> {
  if (typeof window === 'undefined') return
  const token = getMemoryAccessToken()
  if (token && !isTokenExpired(token)) return
  if (!token && !Cookies.get('userInfo')) return
  try {
    await runRefreshDeduped()
  } catch {
    /* 401/403이면 executeTokenRefreshOnce에서 이미 handleAuthFail */
  }
}

function applyAuthorizationHeader(config: InternalAxiosRequestConfig): void {
  if (!config.headers) return
  const t = getMemoryAccessToken()
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  } else {
    delete config.headers.Authorization
  }
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const reqPath = resolveRequestPath(config)

    if (skipsRequestEnsureToken(reqPath)) {
      if (isTokenRefreshPath(reqPath)) {
        if (config.headers) delete config.headers.Authorization
      } else {
        applyAuthorizationHeader(config)
      }
      return config
    }

    if (!isPublicSyscodePath(reqPath)) {
      if (isPublicBoard(reqPath) || isPublicAuthFlow(reqPath)) {
        if (
          isArticleDetailGet(config) ||
          isLibraryMemberEndpoint(config) ||
          isContentQuestionAnswerPost(config) ||
          isContentMyAnsweredContentsGet(config) ||
          isContentMyAnswersGet(config)
        ) {
          try {
            await ensureToken(
              isLibraryMemberEndpoint(config) ||
              isContentQuestionAnswerPost(config) ||
              isContentMyAnsweredContentsGet(config) ||
              isContentMyAnswersGet(config)
                ? 'strict'
                : 'lenient'
            )
          } catch (e) {
            if (
              isLibraryMemberEndpoint(config) ||
              isContentQuestionAnswerPost(config) ||
              isContentMyAnsweredContentsGet(config) ||
              isContentMyAnswersGet(config)
            ) {
              if (!isAuthFailHandled) handleAuthFail()
              return Promise.reject(e)
            }
          }
        }
      } else {
        try {
          await ensureToken('strict')
        } catch (e) {
          if (!isAuthFailHandled) handleAuthFail()
          return Promise.reject(e)
        }
      }
    }
    applyAuthorizationHeader(config)
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    const reqPath = resolveRequestPath(originalRequest)

    if (skips401RefreshRetry(reqPath)) {
      if (isTokenRefreshPath(reqPath) && !isAuthFailHandled) {
        handleAuthFail()
      }
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      if (!isAuthFailHandled) handleAuthFail()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await runRefreshDeduped()
      return apiClient.request(originalRequest)
    } catch {
      if (!isAuthFailHandled) handleAuthFail()
      return Promise.reject(error)
    }
  }
)

export default apiClient

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'

// 로컬 개발 시 기본값: localhost:8001 (공개 API), 프로덕션: api.inde.kr
export const getApiBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return 'http://localhost:8001'
  }
  return 'https://api.inde.kr'
}

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CURSOR_loginRules.md에 따라 true로 설정
})

// 공개 게시판(인증 불필요): 토큰을 붙이지 않음 — 만료된 토큰 전송 방지
const pathOnly = (url?: string) => {
  if (!url) return ''
  return url.replace(getApiBaseURL(), '').split('?')[0].replace(/^https?:\/\/[^/]+/, '') || url
}

/** baseURL+url 조합·선행 슬래시 누락 대비 — 인터셉터에서 경로 매칭 실패로 Bearer 미첨부되는 것 방지 */
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

/** 공개 API 시스코드 조회 — 익명 허용. 만료 토큰으로 ensureToken 실패 시 전역 로그아웃·리다이렉트 방지 */
const isPublicSyscodePath = (url?: string) => {
  const path = pathOnly(url)
  return /^\/systemmanage\/syscode(\/|$)/.test(path)
}

/**
 * `/api/library/*` 가 isPublicBoard에 걸리지만, 아래는 회원 JWT 필수(contentShareLinkCopy.md ensure 등).
 * 이 경로들은 Authorization을 붙이지 않으면 서버가 401 → response 인터셉터가 handleAuthFail로 로그인 풀림.
 */
const isLibraryMemberEndpoint = (config: InternalAxiosRequestConfig) => {
  const path = resolveRequestPath(config)
  const m = String(config.method || 'get').toLowerCase()
  if (m === 'post' && /^\/api\/library\/content-share\/ensure\/?$/.test(path)) return true
  if (m === 'post' && /^\/api\/library\/useractivity\/rating\/?$/.test(path)) return true
  if ((m === 'post' || m === 'delete') && /^\/api\/library\/useractivity\/bookmark\/?$/.test(path)) return true
  if (m === 'get' && /^\/api\/library\/useractivity\/me\//.test(path)) return true
  return false
}

/** GET /api/articles/{숫자id} — 로그인 시 JWT를 붙여 전체 본문 수신 (비회원은 미리보기 %) */
const isArticleDetailGet = (config: InternalAxiosRequestConfig) => {
  if (String(config.method || 'get').toLowerCase() !== 'get') return false
  const path = resolveRequestPath(config)
  return /^\/api\/articles\/\d+\/?$/.test(path)
}

/** POST /api/content/question-answer — 콘텐츠 질문 답변 등록 (회원 JWT 필수) */
const isContentQuestionAnswerPost = (config: InternalAxiosRequestConfig) => {
  const path = resolveRequestPath(config)
  const m = String(config.method || 'get').toLowerCase()
  return m === 'post' && /^\/api\/content\/question-answer\/?$/.test(path)
}

/** 비로그인·가입 단계 API — 만료 토큰으로 refresh 실패 시 리다이렉트 방지 (ensureToken 생략) */
const isPublicAuthFlow = (url?: string) => {
  const path = pathOnly(url)
  return /^\/auth\/(send-sms|verify-sms|register|login|send-sms-find-id|find-id|send-password-reset-code|verify-password-reset-code|reset-password)(\/|$)/i.test(
    path
  )
}

// 토큰 갱신 중 플래그 및 Promise 공유 (userAuthPlan §9 §16)
let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let refreshRetryCount = 0
const MAX_REFRESH_RETRIES = 3
const TOKEN_EXPIRY_BUFFER_SEC = 60

/** 인증 실패 시 단일 진입점. 리다이렉트·중복 실행 방지 (gnb_login_logout_analysis Part V.8) */
let isAuthFailHandled = false
export function handleAuthFail(): void {
  if (isAuthFailHandled) return
  isAuthFailHandled = true
  Cookies.remove('accessToken')
  Cookies.remove('refreshToken')
  Cookies.remove('userInfo')
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login?error=UNAUTHORIZED')
  }
}

/** JWT payload exp 확인 — 만료 또는 만료 임박 시 true (userAuthPlan §3 §15) */
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
    return exp - TOKEN_EXPIRY_BUFFER_SEC <= now
  } catch {
    return true
  }
}

/** 공개 API 토큰 갱신: Body에 refresh_token 전송 (로그인 풀림 방지) — ensureToken보다 먼저 정의 */
const refreshAccessToken = async (): Promise<string> => {
  try {
    const refreshToken = Cookies.get('refreshToken')
    if (!refreshToken) throw new Error('리프레시 토큰이 없습니다.')

    const baseURL = getApiBaseURL()
    const response = await axios.post<{
      access_token: string
      refresh_token: string
      expires_in?: number
      user?: Record<string, unknown>
    }>(
      `${baseURL}/auth/tokenrefresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    )
    const data = response.data
    const newAccessToken = data?.access_token
    const newRefreshToken = data?.refresh_token
    if (!newAccessToken || !newRefreshToken) throw new Error('토큰 갱신 응답에 토큰이 없습니다.')

    const opts = {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    }
    Cookies.set('accessToken', newAccessToken, opts)
    Cookies.set('refreshToken', newRefreshToken, { ...opts, expires: 7 })
    if (data?.user) {
      Cookies.set('userInfo', JSON.stringify(data.user), opts)
    }
    refreshRetryCount = 0
    return newAccessToken
  } catch (err) {
    refreshRetryCount++
    if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
      refreshRetryCount = 0
      handleAuthFail()
      throw new Error('토큰 갱신에 실패했습니다. 다시 로그인해 주세요.')
    }
    throw err
  }
}

/** 요청 전 토큰 유효 보장: 만료 시 refresh 후 진행, 실패 시 throw (userAuthPlan §9 §10 §15 §16) */
async function ensureToken(): Promise<void> {
  if (typeof window === 'undefined') return
  let token = Cookies.get('accessToken')
  if (!token && Cookies.get('refreshToken')) {
    await refreshAccessToken()
    return
  }
  if (!token) return
  if (!isTokenExpired(token)) return

  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false
      refreshPromise = null
    })
  }
  await refreshPromise
}

// Request Interceptor: ensureToken 후 토큰 첨부, 실패 시 요청 중단 (userAuthPlan §10 §16)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const reqPath = resolveRequestPath(config)
    if (isPublicSyscodePath(reqPath)) {
      const token = Cookies.get('accessToken')
      if (token && !isTokenExpired(token) && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    }

    if (isPublicBoard(reqPath) || isPublicAuthFlow(reqPath)) {
      if (
        isArticleDetailGet(config) ||
        isLibraryMemberEndpoint(config) ||
        isContentQuestionAnswerPost(config)
      ) {
        try {
          await ensureToken()
        } catch (e) {
          if (isLibraryMemberEndpoint(config) || isContentQuestionAnswerPost(config)) {
            handleAuthFail()
            return Promise.reject(e)
          }
          /* 비로그인·갱신 실패: 미리보기 본문만 */
        }
        const token = Cookies.get('accessToken')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    }
    try {
      await ensureToken()
    } catch (e) {
      handleAuthFail()
      return Promise.reject(e)
    }
    const token = Cookies.get('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response Interceptor: 401 시 handleAuthFail 호출 (gnb_login_logout_analysis Part V.9)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    refreshRetryCount = 0
    return response
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const reqPath = error.config ? resolveRequestPath(error.config) : ''
      if (!isPublicBoard(reqPath) && !isPublicSyscodePath(reqPath) && !isPublicAuthFlow(reqPath)) {
        handleAuthFail()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient





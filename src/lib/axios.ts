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
const isPublicBoard = (url?: string) => {
  if (!url) return false
  const path = url.replace(getApiBaseURL(), '').split('?')[0].replace(/^https?:\/\/[^/]+/, '') || url
  return /^\/api\/(notices|faqs|articles|content|events|videos)(\/|$)/.test(path)
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

/** 요청 전 토큰 유효 보장: 만료 시 refresh 후 진행, 실패 시 throw (userAuthPlan §9 §10 §15 §16) */
async function ensureToken(): Promise<void> {
  if (typeof window === 'undefined') return
  const token = Cookies.get('accessToken')
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

/** 공개 API 토큰 갱신: Body에 refresh_token 전송 (로그인 풀림 방지) */
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
      `${baseURL}/auth/tokenrefresh/`,
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

// Request Interceptor: ensureToken 후 토큰 첨부, 실패 시 요청 중단 (userAuthPlan §10 §16)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (isPublicBoard(config.url)) return config
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
      handleAuthFail()
    }
    return Promise.reject(error)
  }
)

export default apiClient





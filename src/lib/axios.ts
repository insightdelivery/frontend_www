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
  return /^\/api\/(notices|faqs|articles)(\/|$)/.test(path)
}

// 토큰 갱신 중 플래그 (무한 루프 방지)
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: string) => void; reject: (error?: unknown) => void }> = []
let refreshRetryCount = 0
const MAX_REFRESH_RETRIES = 3

const redirectToLogin = () => {
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    Cookies.remove('userInfo')
    window.location.href = '/login?error=UNAUTHORIZED'
  }
}

/** 공개 API 토큰 갱신: Body에 refresh_token 전송 (로그인 풀림 방지) */
const refreshAccessToken = async (): Promise<string> => {
  const currentRetry = refreshRetryCount + 1
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
      redirectToLogin()
      throw new Error('토큰 갱신에 실패했습니다. 다시 로그인해 주세요.')
    }
    throw err
  }
}

// Request Interceptor: 토큰 자동 첨부 (공지/FAQ 등 공개 API는 제외)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (isPublicBoard(config.url)) return config
    const token = Cookies.get('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response Interceptor: 401 시 refresh_token으로 갱신 후 재시도, 실패 시 로그인 페이지로
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    refreshRetryCount = 0
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const requestUrl = originalRequest?.url ?? ''

    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/tokenrefresh')) {
      return Promise.reject(error)
    }
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token?: string) => {
              if (token && originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(originalRequest))
            },
            reject,
          })
        }).catch((err) => Promise.reject(err))
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const newAccessToken = await refreshAccessToken()
        failedQueue.forEach(({ resolve }) => resolve(newAccessToken))
        failedQueue = []
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        isRefreshing = false
        return apiClient(originalRequest)
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError))
        failedQueue = []
        isRefreshing = false
        if (refreshRetryCount >= MAX_REFRESH_RETRIES) redirectToLogin()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient





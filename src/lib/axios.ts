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
  return /^\/api\/(notices|faqs)(\/|$)/.test(path)
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
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: 401 에러 처리
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    // 401 Unauthorized 에러 감지 시
    if (error.response?.status === 401) {
      // 쿠키 삭제
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      Cookies.remove('userInfo')
      
      // 로그인 페이지로 강제 이동
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?error=UNAUTHORIZED'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient





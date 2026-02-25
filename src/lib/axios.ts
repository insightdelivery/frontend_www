import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.inde.kr',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CURSOR_loginRules.md에 따라 true로 설정
})

// Request Interceptor: 토큰 자동 첨부
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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





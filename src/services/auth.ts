import apiClient from '@/lib/axios'
import Cookies from 'js-cookie'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  password2: string
}

export interface UserInfo {
  id: number
  email: string
  phone?: string
  name?: string
  position?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  region_type?: 'DOMESTIC' | 'FOREIGN'
  region_domestic?: string
  region_foreign?: string
  profile_completed: boolean
  joined_via?: 'LOCAL' | 'KAKAO' | 'NAVER' | 'GOOGLE'
  created_at?: string
  updated_at?: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: UserInfo
}

export interface RegisterResponse {
  message: string
  user: UserInfo
}

export interface ProfileCompleteRequest {
  email: string
  phone: string
  name: string
  position: string
  birth_year: number
  birth_month: number
  birth_day: number
  region_type: 'DOMESTIC' | 'FOREIGN'
  region_domestic?: string
  region_foreign?: string
}

export interface ProfileCompleteResponse {
  message: string
  user: UserInfo
}

/**
 * 일반 로그인
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login/', data)
    
    // 토큰 저장
    if (response.data.access_token && response.data.refresh_token) {
      saveTokens(response.data.access_token, response.data.refresh_token, response.data.user)
    }
    
    return response.data
  } catch (error: any) {
    console.error('로그인 API 오류:', error)
    throw error
  }
}

/**
 * 회원가입
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await apiClient.post<RegisterResponse>('/auth/register/', data)
    return response.data
  } catch (error: any) {
    console.error('회원가입 API 오류:', error)
    throw error
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export const getMe = async (): Promise<UserInfo> => {
  try {
    const response = await apiClient.get<UserInfo>('/me/')
    return response.data
  } catch (error: any) {
    console.error('사용자 정보 조회 API 오류:', error)
    throw error
  }
}

/**
 * 프로필 완성/수정
 */
export const completeProfile = async (data: ProfileCompleteRequest): Promise<ProfileCompleteResponse> => {
  try {
    const response = await apiClient.put<ProfileCompleteResponse>('/profile/complete/', data)
    
    // 사용자 정보 업데이트
    if (response.data.user) {
      Cookies.set('userInfo', JSON.stringify(response.data.user), {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })
    }
    
    return response.data
  } catch (error: any) {
    console.error('프로필 완성 API 오류:', error)
    throw error
  }
}

/**
 * 프로필 수정 (기존 정보 업데이트)
 */
export const updateProfile = async (data: ProfileCompleteRequest): Promise<ProfileCompleteResponse> => {
  return completeProfile(data)
}

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout/')
  } catch (error: any) {
    console.error('로그아웃 API 오류:', error)
  } finally {
    // 에러가 발생해도 로컬 쿠키는 삭제
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    Cookies.remove('userInfo')
    
    // 로그인 페이지로 이동
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

/**
 * 토큰 저장
 * CURSOR_RULES.md에 따라 쿠키에만 저장 (localStorage 사용 금지)
 */
export const saveTokens = (accessToken: string, refreshToken: string, userInfo?: UserInfo) => {
  const cookieOptions = {
    expires: 1, // 1일
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  }
  
  Cookies.set('accessToken', accessToken, cookieOptions)
  Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 7 }) // 7일
  
  if (userInfo) {
    Cookies.set('userInfo', JSON.stringify(userInfo), cookieOptions)
  }
}

/**
 * 사용자 정보 가져오기 (쿠키에서)
 */
export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = Cookies.get('userInfo')
  if (userInfoStr) {
    try {
      return JSON.parse(userInfoStr) as UserInfo
    } catch {
      return null
    }
  }
  return null
}

/**
 * 토큰 확인
 */
export const getAccessToken = (): string | undefined => {
  return Cookies.get('accessToken')
}

/**
 * 인증 상태 확인
 */
export const isAuthenticated = (): boolean => {
  return !!Cookies.get('accessToken')
}


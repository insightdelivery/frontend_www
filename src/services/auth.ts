import apiClient from '@/lib/axios'
import Cookies from 'js-cookie'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  password_confirm: string
  name: string
  nickname: string
  phone: string
  position?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  region?: string
  is_overseas?: boolean
  newsletter_agree?: boolean
}

export interface UserInfo {
  id: string | number
  email: string
  name?: string
  nickname?: string
  phone?: string
  position?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  region_type?: 'DOMESTIC' | 'FOREIGN'
  region_domestic?: string
  region_foreign?: string
  profile_completed: boolean
  joined_via?: 'LOCAL' | 'KAKAO' | 'NAVER' | 'GOOGLE'
  is_staff?: boolean
  created_at?: string
  updated_at?: string
}

export interface LoginResult {
  access_token: string
  refresh_token: string
  expires_in?: number
  user: UserInfo
}

export interface IndeAPIResponse<T> {
  IndeAPIResponse: {
    ErrorCode: string
    Message: string
    Result: T
  }
}

export type LoginResponse = LoginResult

/** 회원가입 성공 시 (이메일 인증 필요 - 토큰 없음) */
export interface RegisterSuccessResponse {
  success: true
  message: string
  email: string
  user: UserInfo
}
export type RegisterResponse = LoginResult | RegisterSuccessResponse

export interface ProfileCompleteRequest {
  email: string
  phone: string
  name: string
  nickname: string
  position?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  region_type?: 'DOMESTIC' | 'FOREIGN'
  region_domestic?: string
  region_foreign?: string
  newsletter_agree?: boolean
}

export interface ProfileCompleteResponse {
  message: string
  user: UserInfo
}

/**
 * 일반 로그인 (공개 API: raw JSON / 관리자 API: IndeAPIResponse 모두 처리)
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<IndeAPIResponse<LoginResult> & LoginResult>('/auth/login/', data)
    const body = response.data

    const result = body?.IndeAPIResponse?.Result ?? (body?.access_token && body?.user ? body as LoginResult : null)
    if (result?.access_token && result?.user) {
      saveTokens(result.access_token, result.refresh_token, result.user)
      return result
    }
    if (body?.IndeAPIResponse && body.IndeAPIResponse.ErrorCode !== '00') {
      throw new Error(body.IndeAPIResponse.Message || '로그인에 실패했습니다.')
    }
    throw new Error('응답 형식이 올바르지 않습니다.')
  } catch (error: unknown) {
    console.error('로그인 API 오류:', error)
    const err = error as { response?: { data?: { IndeAPIResponse?: { Message?: string }; error?: string; message?: string } }; message?: string }
    const msg =
      err.response?.data?.IndeAPIResponse?.Message ??
      err.response?.data?.error ??
      err.response?.data?.message ??
      (error instanceof Error ? error.message : '로그인에 실패했습니다.')
    throw new Error(msg)
  }
}

/**
 * 회원가입 (이메일 인증 필요: 토큰 없이 success/email 반환, 인증 메일 발송됨)
 * API 응답: IndeAPIResponse(Result 내부에 success, email, user) 또는 raw { success, email, user }
 */
export const register = async (data: RegisterRequest): Promise<RegisterSuccessResponse> => {
  try {
    const response = await apiClient.post<
      | { IndeAPIResponse: { ErrorCode: string; Message?: string; Result?: RegisterSuccessResponse } }
      | { ErrorCode: string; Message?: string; Result?: RegisterSuccessResponse }
      | (RegisterSuccessResponse & { access_token?: string })
    >('/auth/register/', data)

    const raw = response.data
    const result =
      raw?.IndeAPIResponse?.Result ?? (raw && 'Result' in raw ? (raw as { Result?: RegisterSuccessResponse }).Result : null) ?? raw
    const body = result as RegisterSuccessResponse & { access_token?: string }

    if (body?.success && body?.email) {
      return { success: true, message: body.message || '', email: body.email, user: body.user! }
    }
    if (body?.access_token && body?.user) {
      saveTokens(body.access_token, (body as any).refresh_token || '', body.user)
      return { success: true, message: '', email: data.email, user: body.user }
    }
    const errMsg =
      (raw as any)?.IndeAPIResponse?.Message ?? (raw as any)?.Message ?? '응답 형식이 올바르지 않습니다.'
    throw new Error(errMsg)
  } catch (error: unknown) {
    console.error('회원가입 API 오류:', error)
    const err = error as {
      response?: { data?: { IndeAPIResponse?: { Message?: string }; ErrorCode?: string; Message?: string; error?: string; message?: string } }
      message?: string
    }
    const msg =
      err.response?.data?.IndeAPIResponse?.Message ??
      err.response?.data?.Message ??
      err.response?.data?.error ??
      err.response?.data?.message ??
      (error instanceof Error ? error.message : '회원가입에 실패했습니다.')
    throw new Error(msg)
  }
}

/**
 * 현재 사용자 정보 가져오기 (raw 또는 IndeAPIResponse.Result)
 */
export const getMe = async (): Promise<UserInfo> => {
  try {
    const response = await apiClient.get<UserInfo & { IndeAPIResponse?: { Result?: UserInfo }; Result?: UserInfo }>('/me/')
    const raw = response.data
    const user = raw?.IndeAPIResponse?.Result ?? (raw && 'Result' in raw ? (raw as { Result?: UserInfo }).Result : null) ?? raw
    if (!user || typeof user !== 'object') throw new Error('사용자 정보를 불러올 수 없습니다.')
    return user as UserInfo
  } catch (error: unknown) {
    console.error('사용자 정보 조회 API 오류:', error)
    throw error
  }
}

/**
 * 프로필 완성/수정 (구글 부가정보 입력 등)
 */
export const completeProfile = async (data: ProfileCompleteRequest): Promise<ProfileCompleteResponse> => {
  try {
    const response = await apiClient.put<
      ProfileCompleteResponse & { IndeAPIResponse?: { Result?: ProfileCompleteResponse }; Result?: ProfileCompleteResponse }
    >('/profile/complete/', data)
    const raw = response.data
    const result = raw?.IndeAPIResponse?.Result ?? (raw && 'Result' in raw ? (raw as { Result?: ProfileCompleteResponse }).Result : null) ?? raw
    const out = result as ProfileCompleteResponse
    if (out?.user) {
      Cookies.set('userInfo', JSON.stringify(out.user), {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })
    }
    return out
  } catch (error: unknown) {
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
  } catch (error: unknown) {
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
 * 이메일 인증 (메일 링크의 토큰으로 인증 완료)
 * API 응답: IndeAPIResponse(Result 내부에 success, message) 또는 raw { success, message }
 */
export const verifyEmail = async (token: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await apiClient.post<
      | { IndeAPIResponse?: { Result?: { success?: boolean; message?: string; error?: string } } }
      | { Result?: { success?: boolean; message?: string; error?: string } }
      | { success?: boolean; message?: string; error?: string }
    >('/auth/verify-email/', { token })

    const raw = response.data
    const data =
      raw?.IndeAPIResponse?.Result ?? (raw && 'Result' in raw ? (raw as { Result?: typeof raw }).Result : null) ?? raw

    if (data && (data as { success?: boolean }).success) {
      return { success: true, message: (data as { message?: string }).message }
    }
    return {
      success: false,
      error: (data as { error?: string })?.error || '인증에 실패했습니다.',
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { IndeAPIResponse?: { Message?: string }; error?: string; Result?: { error?: string } } } }
    const msg =
      err.response?.data?.IndeAPIResponse?.Message ??
      err.response?.data?.error ??
      err.response?.data?.Result?.error ??
      '인증 처리 중 오류가 발생했습니다.'
    return { success: false, error: msg }
  }
}

/**
 * 이메일 인증 메일 다시 보내기 (미인증 상태 로그인 시 로그인 페이지에서 사용)
 */
export const resendVerificationEmail = async (
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await apiClient.post<{ success?: boolean; message?: string; error?: string }>(
      '/auth/resend-verification-email/',
      { email }
    )
    const data = response.data
    if (data.success !== false && (data.message || data.success)) {
      return { success: true, message: data.message }
    }
    return { success: false, error: data.error || '재발송에 실패했습니다.' }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } }
    return { success: false, error: err.response?.data?.error || '재발송 처리 중 오류가 발생했습니다.' }
  }
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


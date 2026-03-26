import apiClient from '@/lib/axios'
import Cookies from 'js-cookie'

/** 공개 API가 4xx 시 raw `{ error }` 또는 `{ IndeAPIResponse: { Message } }` 둘 다 쓸 수 있음 */
function messageFromApiError(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { IndeAPIResponse?: { Message?: string }; error?: string; message?: string } }
    message?: string
  }
  const fromBody =
    err.response?.data?.IndeAPIResponse?.Message ??
    err.response?.data?.error ??
    err.response?.data?.message
  if (fromBody) return fromBody
  if (error instanceof Error) {
    if (/^Request failed with status code \d+$/.test(error.message)) return fallback
    return error.message
  }
  return fallback
}

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
  email_verified?: boolean
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

/** SNS 최초 가입 세션(temp_token) 쿠키명 — oauth_pending JWT (userJoinPlan) */
export const OAUTH_PENDING_TEMP_COOKIE = 'oauthPendingTemp'

/** OAuth 완료 API 응답 (로그인과 동일 형태) */
export interface OAuthCompleteSignupResult {
  access_token: string
  refresh_token: string
  expires_in?: number
  user: UserInfo
}

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
  /** 비밀번호 변경 시에만 전송 (write_only) */
  password?: string
}

/** 회원 탈퇴 요청 (publicUserWithdrawRules §6) */
export interface WithdrawRequest {
  reason?: string
  detail_reason?: string
  password?: string
}

export interface ProfileCompleteResponse {
  message: string
  user: UserInfo
  /** 카카오 등 이메일 미인증 상태에서 부가정보 저장 시 인증 메일 발송 여부 */
  verification_email_sent?: boolean
}

/**
 * 일반 로그인 (공개 API: raw JSON / 관리자 API: IndeAPIResponse 모두 처리)
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<IndeAPIResponse<LoginResult> & LoginResult>('/auth/login', data)
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
/** 회원가입 API 응답: IndeAPIResponse 래핑 또는 raw 또는 직접 성공 객체 */
type RegisterApiRaw =
  | { IndeAPIResponse?: { Result?: RegisterSuccessResponse }; Result?: RegisterSuccessResponse }
  | (RegisterSuccessResponse & { access_token?: string })

/** 회원가입 전 휴대폰 인증 — SMS 발송 (phoneVerificationAligo.md) */
export const sendSignupSms = async (phone: string): Promise<{ success: boolean; message?: string; expires_in?: number }> => {
  try {
    const response = await apiClient.post<{
      success?: boolean
      message?: string
      expires_in?: number
      error?: string
      IndeAPIResponse?: { Message?: string; ErrorCode?: string }
    }>('/auth/send-sms', { phone })
    const body = response.data
    if (body?.IndeAPIResponse && body.IndeAPIResponse.ErrorCode && body.IndeAPIResponse.ErrorCode !== '00') {
      throw new Error(body.IndeAPIResponse.Message || '인증번호 발송에 실패했습니다.')
    }
    if (body?.error) throw new Error(body.error)
    return { success: !!body?.success, message: body?.message, expires_in: body?.expires_in }
  } catch (error: unknown) {
    throw new Error(messageFromApiError(error, '인증번호 발송에 실패했습니다.'))
  }
}

/** 회원가입 전 휴대폰 인증 — 6자리 코드 검증 */
export const verifySignupSms = async (
  phone: string,
  code: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiClient.post<{
      success?: boolean
      message?: string
      error?: string
      IndeAPIResponse?: { Message?: string; ErrorCode?: string }
    }>('/auth/verify-sms', { phone, code })
    const body = response.data
    if (body?.IndeAPIResponse && body.IndeAPIResponse.ErrorCode && body.IndeAPIResponse.ErrorCode !== '00') {
      throw new Error(body.IndeAPIResponse.Message || '인증에 실패했습니다.')
    }
    if (body?.error) throw new Error(body.error)
    return { success: !!body?.success, message: body?.message }
  } catch (error: unknown) {
    throw new Error(messageFromApiError(error, '인증에 실패했습니다.'))
  }
}

export const setOauthPendingTempToken = (token: string) => {
  const cookieOptions = {
    expires: 10 / (24 * 60),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  }
  Cookies.set(OAUTH_PENDING_TEMP_COOKIE, token, cookieOptions)
}

export const getOauthPendingTempToken = (): string | undefined => Cookies.get(OAUTH_PENDING_TEMP_COOKIE)

export const clearOauthPendingTempToken = () => {
  Cookies.remove(OAUTH_PENDING_TEMP_COOKIE, { path: '/' })
}

/**
 * SNS 최초 가입 마무리: temp_token(oauth_pending JWT) + 휴대폰(SMS 인증 완료된 번호)
 */
export const oauthCompleteSignup = async (tempToken: string, phone: string): Promise<OAuthCompleteSignupResult> => {
  try {
    const response = await apiClient.post<OAuthCompleteSignupResult & { IndeAPIResponse?: { Result?: OAuthCompleteSignupResult } }>(
      '/auth/oauth-complete-signup',
      { temp_token: tempToken, phone },
    )
    const raw = response.data
    const body =
      raw?.IndeAPIResponse?.Result ?? (raw && 'access_token' in raw && raw.access_token ? raw : null)
    if (!body?.access_token || !body?.user) {
      throw new Error('응답 형식이 올바르지 않습니다.')
    }
    saveTokens(body.access_token, body.refresh_token || '', body.user)
    clearOauthPendingTempToken()
    return body
  } catch (error: unknown) {
    throw new Error(messageFromApiError(error, '가입 완료 처리에 실패했습니다.'))
  }
}

export const register = async (data: RegisterRequest): Promise<RegisterSuccessResponse> => {
  try {
    const response = await apiClient.post<RegisterApiRaw>('/auth/register', data)

    const raw = response.data as RegisterApiRaw
    const result =
      (raw && 'IndeAPIResponse' in raw && raw.IndeAPIResponse?.Result) ??
      (raw && typeof raw === 'object' && 'Result' in raw ? (raw as { Result?: RegisterSuccessResponse }).Result : null) ??
      raw
    const body = result as RegisterSuccessResponse & { access_token?: string }

    if (body?.success && body?.email) {
      return { success: true, message: body.message || '', email: body.email, user: body.user! }
    }
    if (body?.access_token && body?.user) {
      saveTokens(body.access_token, (body as any).refresh_token || '', body.user)
      return { success: true, message: '', email: data.email, user: body.user }
    }
    const errMsg: string =
      (raw && 'IndeAPIResponse' in raw ? (raw as { IndeAPIResponse?: { Message?: string } }).IndeAPIResponse?.Message : null) ??
      (raw && typeof raw === 'object' && 'Message' in raw ? (raw as { Message?: string }).Message : null) ??
      '응답 형식이 올바르지 않습니다.'
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
    const response = await apiClient.get<UserInfo & { IndeAPIResponse?: { Result?: UserInfo }; Result?: UserInfo }>('/me')
    const raw = response.data
    const user = raw?.IndeAPIResponse?.Result ?? (raw && 'Result' in raw ? (raw as { Result?: UserInfo }).Result : null) ?? raw
    if (!user || typeof user !== 'object') throw new Error('사용자 정보를 불러올 수 없습니다.')
    return user as UserInfo
  } catch (error: unknown) {
    console.error('사용자 정보 조회 API 오류:', error)
    throw error
  }
}

/** 앱 최초 1회만 getMe 호출 (userAuthPlan §2). 이후 호출 시에는 API를 호출하지 않고 null 반환. */
let initAuthDone = false

export const initAuth = async (): Promise<UserInfo | null> => {
  if (initAuthDone) return null
  initAuthDone = true
  if (!Cookies.get('accessToken')) return null
  try {
    return await getMe()
  } catch {
    return null
  }
}


/**
 * 프로필 완성/수정 (구글 부가정보 입력 등)
 */
export const completeProfile = async (data: ProfileCompleteRequest): Promise<ProfileCompleteResponse> => {
  try {
    const response = await apiClient.put<
      ProfileCompleteResponse & { IndeAPIResponse?: { Result?: ProfileCompleteResponse }; Result?: ProfileCompleteResponse }
    >('/profile/complete', data)
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
 * 로그아웃 (gnb_login_logout_analysis Part V.5)
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout')
  } catch (error: unknown) {
    console.error('로그아웃 API 오류:', error)
  } finally {
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    Cookies.remove('userInfo')
    Cookies.remove(OAUTH_PENDING_TEMP_COOKIE, { path: '/' })
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  }
}

/**
 * 회원 탈퇴 요청 (POST /auth/withdraw/request, publicUserWithdrawRules §6)
 * @returns { success: true } 성공 시 로그아웃 처리 후 호출 측에서 이동 처리. { success: false, notImplemented: true } API 미구현.
 */
export const requestWithdraw = async (data: WithdrawRequest): Promise<{ success: boolean; notImplemented?: boolean; error?: string }> => {
  try {
    await apiClient.post('/auth/withdraw/request', data)
    return { success: true }
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string; detail?: string } } }
    if (err.response?.status === 404 || err.response?.status === 501) {
      return { success: false, notImplemented: true }
    }
    const msg =
      err.response?.data?.message ??
      err.response?.data?.detail ??
      (error instanceof Error ? error.message : '탈퇴 요청에 실패했습니다.')
    return { success: false, error: msg }
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

/** verifyEmail API 응답: IndeAPIResponse 래핑 또는 raw */
type VerifyEmailRaw = {
  IndeAPIResponse?: { Result?: { success?: boolean; message?: string; error?: string } }
  Result?: { success?: boolean; message?: string; error?: string }
} | { success?: boolean; message?: string; error?: string }

/**
 * 이메일 인증 (메일 링크의 토큰으로 인증 완료)
 * API 응답: IndeAPIResponse(Result 내부에 success, message) 또는 raw { success, message }
 */
export const verifyEmail = async (token: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await apiClient.post<VerifyEmailRaw>('/auth/verify-email', { token })

    const raw = response.data as VerifyEmailRaw
    const data =
      (raw && 'IndeAPIResponse' in raw ? (raw as { IndeAPIResponse?: { Result?: { success?: boolean; message?: string; error?: string } } }).IndeAPIResponse?.Result : null) ??
      (raw && typeof raw === 'object' && 'Result' in raw ? (raw as { Result?: { success?: boolean; message?: string; error?: string } }).Result : null) ??
      raw

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
      '/auth/resend-verification-email',
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


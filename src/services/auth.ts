import apiClient, { resetAuthFailHandled, restoreSessionTokens } from '@/lib/axios'
import { clearMypageProfileUnlockFlags } from '@/lib/mypageProfileUnlock'
import { USER_INFO_COOKIE_EXPIRES_DAYS } from '@/constants/authCookies'
import { clearMemoryAccessToken, getMemoryAccessToken, setMemoryAccessToken } from '@/lib/accessTokenMemory'
import Cookies from 'js-cookie'

/**
 * 인증 상태의 근거는 (1) 메모리 access token (2) HttpOnly refresh 쿠키 → `/auth/tokenrefresh` 뿐이다.
 * `userInfo` 일반 쿠키는 헤더·UI 표시용 캐시이며, 없거나 만료되어도 refresh가 살아 있으면 세션 복구가 가능해야 한다.
 */

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

/**
 * 공개 API 응답에서 `IndeAPIResponse.Result` 또는 `Result` 우선 추출 (wwwMypagePlan §10.6).
 * 레거시 평면 JSON은 `null` 반환 → 호출부에서 루트 객체 폴백.
 */
export function unwrapApiResult<T extends object>(data: unknown): T | null {
  if (data === null || data === undefined || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const inde = d.IndeAPIResponse
  if (inde && typeof inde === 'object' && inde !== null) {
    const r = (inde as { Result?: T }).Result
    if (r !== undefined && r !== null && typeof r === 'object') return r
  }
  if ('Result' in d && d.Result !== undefined && d.Result !== null && typeof d.Result === 'object') {
    return d.Result as T
  }
  return null
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
  /** 뉴스레터·이벤트/혜택 정보 수신 동의 */
  newsletter_agree?: boolean
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

/** 레거시 호환: 토큰 없이 success만 오는 경우(현재 LOCAL 가입은 사용하지 않음) */
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
  position?: string | null
  birth_year?: number | null
  birth_month?: number | null
  birth_day?: number | null
  region_type?: 'DOMESTIC' | 'FOREIGN' | null
  region_domestic?: string | null
  region_foreign?: string | null
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
 * 회원가입 — LOCAL 성공 시 로그인과 동일하게 access_token·refresh_token·user 반환 (즉시 로그인).
 * API 응답: IndeAPIResponse 래핑 또는 raw `{ access_token, refresh_token, user }`
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

/**
 * 로그인 사용자 회원정보 휴대폰 변경 — `POST /auth/send-sms-profile-phone` (JWT 필수)
 */
export const sendProfilePhoneSms = async (
  phone: string,
): Promise<{ success: boolean; message?: string; expires_in?: number }> => {
  try {
    const response = await apiClient.post<{
      success?: boolean
      message?: string
      expires_in?: number
      error?: string
      detail?: string
      IndeAPIResponse?: { Message?: string; ErrorCode?: string }
    }>('/auth/send-sms-profile-phone', { phone })
    const body = response.data
    if (body?.IndeAPIResponse && body.IndeAPIResponse.ErrorCode && body.IndeAPIResponse.ErrorCode !== '00') {
      throw new Error(body.IndeAPIResponse.Message || '인증번호 발송에 실패했습니다.')
    }
    if ((body as { error?: string }).error) throw new Error((body as { error: string }).error)
    if ((body as { detail?: string }).detail) throw new Error((body as { detail: string }).detail)
    return { success: !!body?.success, message: body?.message, expires_in: body?.expires_in }
  } catch (error: unknown) {
    throw new Error(messageFromApiError(error, '인증번호 발송에 실패했습니다.'))
  }
}

/**
 * 휴대폰 인증번호 검증 — `POST /auth/verify-sms`
 * `purpose`: `signup`(기본) = `send-sms` 행만, `find_id` = `send-sms-find-id` 행만 검증(두 흐름이 같은 번호로 겹칠 때 분리).
 */
export const verifySignupSms = async (
  phone: string,
  code: string,
  options?: { purpose?: 'signup' | 'find_id' | 'profile_phone' },
): Promise<{ success: boolean; message?: string }> => {
  try {
    const payload: { phone: string; code: string; purpose?: string } = { phone, code }
    if (options?.purpose) payload.purpose = options.purpose
    const response = await apiClient.post<{
      success?: boolean
      message?: string
      error?: string
      IndeAPIResponse?: { Message?: string; ErrorCode?: string }
    }>('/auth/verify-sms', payload)
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

/** `verifySignupSms`와 동일 API — 문서·호출부 가독성용 별칭 */
export const verifySms = verifySignupSms

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

export type OAuthPendingClaims = {
  email: string
  name: string
  nickname: string
  provider: string
  kakao_placeholder_email: boolean
}

/** SNS 가입 세션 JWT에서 프리필용 클레임 조회 (로그인 불필요) */
export async function fetchOAuthPendingClaims(tempToken: string): Promise<OAuthPendingClaims> {
  const response = await apiClient.post<Record<string, unknown>>('/auth/oauth-pending-claims', { temp_token: tempToken })
  const raw = response.data
  const inner = unwrapApiResult<OAuthPendingClaims>(raw)
  const d = inner ?? (raw as OAuthPendingClaims)
  return {
    email: typeof d.email === 'string' ? d.email : '',
    name: typeof d.name === 'string' ? d.name : '',
    nickname: typeof d.nickname === 'string' ? d.nickname : '',
    provider: typeof d.provider === 'string' ? d.provider : '',
    kakao_placeholder_email: !!d.kakao_placeholder_email,
  }
}

/** SNS 가입 단계 비로그인 이메일 중복 확인 */
export async function checkSignupEmailAvailable(email: string): Promise<{ available: boolean; error?: string }> {
  const response = await apiClient.post<Record<string, unknown>>('/auth/signup-email-availability', {
    email: email.trim(),
  })
  const raw = response.data
  const inner = unwrapApiResult<{ available?: boolean; error?: string }>(raw)
  const d = inner ?? (raw as { available?: boolean; error?: string })
  return {
    available: !!d?.available,
    error: typeof d?.error === 'string' ? d.error : undefined,
  }
}

export type OauthCompleteSignupProfile = {
  email: string
  name: string
  nickname: string
  /** 미전달 시 서버 기본 true(뉴스레터·이벤트 수신 동의) */
  newsletter_agree?: boolean
}

/**
 * SNS 최초 가입 마무리: temp_token(oauth_pending JWT) + 휴대폰(SMS 인증 완료) + 이메일·이름·닉네임(요청 시 JWT 값 덮어씀)
 */
export const oauthCompleteSignup = async (
  tempToken: string,
  phone: string,
  profile?: OauthCompleteSignupProfile,
): Promise<OAuthCompleteSignupResult> => {
  try {
    const requestBody: Record<string, string | boolean> = { temp_token: tempToken, phone: phone.trim() }
    if (profile) {
      requestBody.email = profile.email.trim()
      requestBody.name = profile.name.trim()
      requestBody.nickname = profile.nickname.trim()
      if (profile.newsletter_agree !== undefined) {
        requestBody.newsletter_agree = profile.newsletter_agree
      }
    }
    const response = await apiClient.post<OAuthCompleteSignupResult & { IndeAPIResponse?: { Result?: OAuthCompleteSignupResult } }>(
      '/auth/oauth-complete-signup',
      requestBody,
    )
    const raw = response.data
    const result =
      raw?.IndeAPIResponse?.Result ?? (raw && 'access_token' in raw && raw.access_token ? raw : null)
    if (!result?.access_token || !result?.user) {
      throw new Error('응답 형식이 올바르지 않습니다.')
    }
    saveTokens(result.access_token, result.refresh_token || '', result.user)
    clearOauthPendingTempToken()
    return result
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
    const fromResult = unwrapApiResult<UserInfo>(raw)
    const user =
      fromResult ??
      (raw && typeof raw === 'object' && 'email' in raw ? (raw as UserInfo) : null)
    if (!user || typeof user !== 'object' || !user.email) {
      throw new Error('사용자 정보를 불러올 수 없습니다.')
    }
    return user as UserInfo
  } catch (error: unknown) {
    console.error('사용자 정보 조회 API 오류:', error)
    throw error
  }
}

/**
 * 세션 초기화용 getMe — 동시에 여러 번 호출돼도 동일 Promise 공유 (React Strict Mode 이중 effect 대비).
 * 호출부는 AuthProvider 한정이나, 모듈 레벨 플래그로 두 번째 호출을 null 처리하면 경합 버그가 난다.
 */
let initAuthInFlight: Promise<UserInfo | null> | null = null

export const initAuth = async (): Promise<UserInfo | null> => {
  await restoreSessionTokens()
  if (!getMemoryAccessToken()) return null
  if (!initAuthInFlight) {
    initAuthInFlight = getMe()
      .then((u) => u)
      .catch(() => null)
      .finally(() => {
        initAuthInFlight = null
      })
  }
  return initAuthInFlight
}


/**
 * 로그인 상태에서 이메일 사용 가능 여부 (다른 회원과 중복 아님). GET /me/email-availability?email=
 */
export async function checkMeEmailAvailable(email: string): Promise<{ available: boolean; error?: string }> {
  const trimmed = email.trim()
  const response = await apiClient.get<Record<string, unknown>>(
    `/me/email-availability?email=${encodeURIComponent(trimmed)}`,
  )
  const raw = response.data
  const inner = unwrapApiResult<{ available?: boolean; error?: string }>(raw)
  const d = inner ?? (raw as { available?: boolean; error?: string })
  return {
    available: !!d?.available,
    error: typeof d?.error === 'string' ? d.error : undefined,
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
    const fromResult = unwrapApiResult<ProfileCompleteResponse>(raw)
    const out = (fromResult ?? (raw as ProfileCompleteResponse)) as ProfileCompleteResponse
    if (out?.user) {
      Cookies.set('userInfo', JSON.stringify(out.user), {
        expires: USER_INFO_COOKIE_EXPIRES_DAYS,
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
    clearMemoryAccessToken()
    Cookies.remove('userInfo', { path: '/' })
    Cookies.remove('accessToken', { path: '/' })
    Cookies.remove('refreshToken', { path: '/' })
    Cookies.remove(OAUTH_PENDING_TEMP_COOKIE, { path: '/' })
    if (typeof window !== 'undefined') {
      clearMypageProfileUnlockFlags()
      window.location.replace('/')
    }
  }
}

/**
 * 마이페이지 회원정보 수정 전 본인 확인(일반 가입만). 소셜 가입은 API가 skipped로 응답.
 */
export async function verifyProfilePassword(password: string): Promise<{ ok: boolean; skipped?: boolean }> {
  try {
    const res = await apiClient.post('/auth/verify-profile-password', { password: password.trim() })
    const raw = res.data as Record<string, unknown>
    const inner = unwrapApiResult<{ ok?: boolean; skipped?: boolean; error?: string }>(raw)
    const d = inner ?? (raw as { ok?: boolean; skipped?: boolean; error?: string })
    if (d?.error) throw new Error(d.error)
    if (d?.ok || d?.skipped) return { ok: true, skipped: Boolean(d?.skipped) }
    throw new Error('본인 확인에 실패했습니다.')
  } catch (e: unknown) {
    const ax = e as {
      response?: { data?: { error?: string; detail?: string; IndeAPIResponse?: { Message?: string } } }
    }
    const msg =
      ax.response?.data?.error ||
      ax.response?.data?.detail ||
      ax.response?.data?.IndeAPIResponse?.Message
    if (msg) throw new Error(msg)
    if (e instanceof Error) throw e
    throw new Error('본인 확인에 실패했습니다.')
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
 * 로그인·OAuth 직후 — frontend_wwwRules.md §2·§3
 * accessToken → 메모리만. refreshToken → 서버 Set-Cookie(HttpOnly)에만 두고, 클라이언트 쿠키·헤더·바디로 저장·전송하지 않음.
 * (refreshToken 인자는 API 응답 호환용으로 받되 저장하지 않음.)
 *
 * `userInfo` 쿠키: 닉네임 등 UI용 캐시만. 세션 복구 조건으로 쓰지 않는다(`axios.restoreSessionTokens`는 userInfo와 무관하게 refresh 시도).
 */
export const saveTokens = (accessToken: string, _refreshToken: string, userInfo?: UserInfo) => {
  setMemoryAccessToken(accessToken)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console -- 로컬에서 access 수신 확인용
    console.log('[auth] accessToken', accessToken)
  }
  resetAuthFailHandled()
  const cookieOptions = {
    expires: USER_INFO_COOKIE_EXPIRES_DAYS,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  }
  if (userInfo) {
    Cookies.set('userInfo', JSON.stringify(userInfo), cookieOptions)
  }
}

/**
 * UI용 사용자 정보 캐시(일반 쿠키). 없으면 null — 인증 여부는 `getMemoryAccessToken()` 등으로 판단.
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

/** 아이디 찾기 — `POST /auth/send-sms-find-id` (LOCAL만 SMS, raw 또는 IndeAPIResponse) */
export const sendSmsFindId = async (phone: string): Promise<{ success: boolean; message?: string; expires_in?: number }> => {
  try {
    const response = await apiClient.post<{
      success?: boolean
      message?: string
      expires_in?: number
      error?: string
      IndeAPIResponse?: { ErrorCode?: string; Message?: string }
    }>('/auth/send-sms-find-id', { phone })
    const body = response.data
    const wrapped = body?.IndeAPIResponse
    if (wrapped?.ErrorCode && wrapped.ErrorCode !== '00') {
      throw new Error(wrapped.Message || '인증번호를 발송할 수 없습니다.')
    }
    if (body?.error) throw new Error(body.error)
    return { success: !!body?.success, message: body?.message, expires_in: body?.expires_in }
  } catch (error: unknown) {
    throw new Error(messageFromApiError(error, '인증번호 발송에 실패했습니다.'))
  }
}

/** 아이디 찾기 — SMS 인증 완료 후 이메일 조회 (raw `{ email }` 또는 `IndeAPIResponse.Result`) */
export const findIdByPhone = async (phone: string): Promise<{ email: string }> => {
  const response = await apiClient.post<{
    email?: string
    error?: string
    IndeAPIResponse?: { ErrorCode?: string; Message?: string; Result?: { email?: string } }
    Result?: { email?: string }
  }>('/auth/find-id', { phone })
  const body = response.data
  const wrapped = body?.IndeAPIResponse
  if (wrapped?.ErrorCode && wrapped.ErrorCode !== '00') {
    throw new Error(wrapped.Message || '이메일을 조회할 수 없습니다.')
  }
  const email =
    wrapped?.Result?.email ?? body?.Result?.email ?? body?.email
  if (body?.error && !email) throw new Error(body.error)
  if (!email) throw new Error('이메일을 조회할 수 없습니다.')
  return { email }
}

/** 비밀번호 재설정 — 이메일 또는 휴대폰(SMS)로 인증코드 발송 (미등록·SNS·형식 오류는 400 + `error`) */
export const sendPasswordResetCode = async (
  params: { email: string } | { phone: string }
): Promise<{ message: string }> => {
  const body = 'phone' in params ? { phone: params.phone } : { email: params.email }
  try {
    const response = await apiClient.post<{ message?: string; error?: string }>(
      '/auth/send-password-reset-code',
      body
    )
    const data = response.data
    if (data?.error) throw new Error(data.error)
    const fallback =
      'phone' in params
        ? '입력하신 휴대폰 번호로 안내가 전송되었습니다.'
        : '입력하신 이메일로 안내가 전송되었습니다.'
    return { message: data?.message || fallback }
  } catch (error: unknown) {
    throw new Error(messageFromApiError(error, '요청에 실패했습니다.'))
  }
}

/** 비밀번호 재설정 — 인증코드 검증 후 reset_token (raw 또는 `IndeAPIResponse.Result`) */
export const verifyPasswordResetCode = async (
  params: ({ email: string } | { phone: string }) & { code: string }
): Promise<{ reset_token: string }> => {
  const { code, ...rest } = params
  const payload = 'phone' in rest ? { phone: rest.phone, code } : { email: rest.email, code }
  try {
    const response = await apiClient.post<{
      reset_token?: string
      error?: string
      IndeAPIResponse?: { ErrorCode?: string; Message?: string; Result?: { reset_token?: string } }
      Result?: { reset_token?: string }
    }>('/auth/verify-password-reset-code', payload)
    const data = response.data
    const wrapped = data?.IndeAPIResponse
    if (wrapped?.ErrorCode && wrapped.ErrorCode !== '00') {
      throw new Error(wrapped.Message || '인증에 실패했습니다.')
    }
    const reset_token =
      wrapped?.Result?.reset_token ?? data?.Result?.reset_token ?? data?.reset_token
    if (data?.error && !reset_token) throw new Error(data.error)
    if (!reset_token) throw new Error('인증에 실패했습니다.')
    return { reset_token }
  } catch (error: unknown) {
    throw new Error(messageFromApiError(error, '인증에 실패했습니다.'))
  }
}

/** 비밀번호 재설정 — reset_token + 새 비밀번호 (raw 또는 `IndeAPIResponse.Result`) */
export const resetPasswordWithToken = async (
  resetToken: string,
  password: string
): Promise<{ success: boolean; message?: string }> => {
  const response = await apiClient.post<{
    success?: boolean
    message?: string
    error?: string
    IndeAPIResponse?: { ErrorCode?: string; Message?: string; Result?: { success?: boolean; message?: string } }
    Result?: { success?: boolean; message?: string }
  }>('/auth/reset-password', { reset_token: resetToken, password })
  const body = response.data
  const wrapped = body?.IndeAPIResponse
  if (wrapped?.ErrorCode && wrapped.ErrorCode !== '00') {
    throw new Error(wrapped.Message || '비밀번호 변경에 실패했습니다.')
  }
  const result = wrapped?.Result ?? body?.Result
  const success = result?.success ?? body?.success
  const message = result?.message ?? body?.message
  if (body?.error && success !== true) throw new Error(body.error)
  return { success: !!success, message }
}

/**
 * 토큰 확인
 */
export const getAccessToken = (): string | undefined => {
  const t = getMemoryAccessToken()
  return t || undefined
}

/**
 * 인증 상태 확인
 */
export const isAuthenticated = (): boolean => {
  return !!getMemoryAccessToken()
}


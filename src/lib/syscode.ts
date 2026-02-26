// syscode 데이터 관리 유틸리티
// localStorage에 24시간 캐시하여 관리 (로그인 시 로드, 회원가입/프로필 등에서 사용)

import apiClient from '@/lib/axios'

export interface SysCodeItem {
  sysCodeSid: string
  sysCodeName: string
  sysCodeValue: string
  sysCodeSort: number
  sysCodeUseFlag: string
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간 (밀리초)
const CACHE_KEY = 'sysCodeData'

/** 로그인 시 및 접속 시 공통으로 로드하는 부모 코드 ID 목록 */
export const SYSCODE_PARENT_IDS = [
  'SYS26209B002', // 아티클 카테고리
  'SYS26127B017', // 회원가입 지역
  'SYS26127B018', // 회원 가입 지역 국내
  'SYS26127B019', // 회원 가입 지역 해외
  'SYS26127B006', // 직분 코드
  'SYS26209B020', // 아티클 발행정보
  'SYS26209B015', // 아티클 공개범위설정
] as const

/** 지역: 국내 = SYS26127B018, 해외 = SYS26127B019 */
export const REGION_DOMESTIC_PARENT = 'SYS26127B018'
export const REGION_FOREIGN_PARENT = 'SYS26127B019'
/** 직분 = SYS26127B006 */
export const POSITION_PARENT = 'SYS26127B006'

// syscode 데이터를 localStorage에서 가져오기
export const getSysCodeFromCache = (sysCodeGubn: string): SysCodeItem[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const allCacheData = JSON.parse(cached)
    const now = Date.now()
    if (now - allCacheData.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return allCacheData[sysCodeGubn] || null
  } catch (error) {
    console.error('syscode 캐시 읽기 오류:', error)
    return null
  }
}

// syscode 데이터를 localStorage에 저장
export const setSysCodeToCache = (sysCodeGubn: string, data: SysCodeItem[]): void => {
  try {
    const existingCache = localStorage.getItem(CACHE_KEY)
    let allCacheData: Record<string, unknown> & { timestamp: number } = {
      timestamp: Date.now(),
    }
    if (existingCache) {
      const parsed = JSON.parse(existingCache)
      if (Date.now() - parsed.timestamp <= CACHE_DURATION) {
        allCacheData = parsed
        allCacheData.timestamp = Date.now()
      }
    }
    allCacheData[sysCodeGubn] = data
    localStorage.setItem(CACHE_KEY, JSON.stringify(allCacheData))
  } catch (error) {
    console.error('syscode 캐시 저장 오류:', error)
  }
}

// syscode API 호출 (공개 API 또는 관리자 API syscode 엔드포인트 사용)
const fetchSysCodeFromAPI = async (sysCodeGubn: string): Promise<SysCodeItem[]> => {
  try {
    const response = await apiClient.get('/systemmanage/syscode/', {
      params: { sysCodeParentsSid: sysCodeGubn },
    })
    let syscodeList: unknown[] = []
    if (response.data?.IndeAPIResponse?.ErrorCode === '00') {
      syscodeList = response.data.IndeAPIResponse.Result || []
    } else if (Array.isArray(response.data)) {
      syscodeList = response.data
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      syscodeList = response.data.results
    } else {
      return []
    }
    return (syscodeList as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
      sysCodeSid: String(item.sysCodeSid ?? ''),
      sysCodeName: String(item.sysCodeName ?? ''),
      sysCodeValue: String(item.sysCodeVal ?? item.sysCodeValue ?? item.sysCodeSid ?? ''),
      sysCodeSort: Number(item.sysCodeSort ?? 0),
      sysCodeUseFlag: String(item.sysCodeUse ?? item.sysCodeUseFlag ?? 'Y'),
    }))
  } catch (error) {
    console.error(`syscode API 호출 오류 (${sysCodeGubn}):`, error)
    return []
  }
}

// by_parent API로 하위 시스템 코드 조회
const fetchSysCodeByParent = async (parentId: string): Promise<SysCodeItem[]> => {
  try {
    const response = await apiClient.get('/systemmanage/syscode/by_parent/', {
      params: { parent_id: parentId },
    })
    let syscodeList: unknown[] = []
    if (response.data?.IndeAPIResponse?.ErrorCode === '00') {
      syscodeList = response.data.IndeAPIResponse.Result || []
    } else if (Array.isArray(response.data)) {
      syscodeList = response.data
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      syscodeList = response.data.results
    } else {
      return []
    }
    return (syscodeList as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
      sysCodeSid: String(item.sysCodeSid ?? ''),
      sysCodeName: String(item.sysCodeName ?? ''),
      sysCodeValue: String(item.sysCodeVal ?? item.sysCodeValue ?? item.sysCodeSid ?? ''),
      sysCodeSort: Number(item.sysCodeSort ?? 0),
      sysCodeUseFlag: String(item.sysCodeUse ?? item.sysCodeUseFlag ?? 'Y'),
    }))
  } catch (error) {
    console.error(`syscode by_parent API 오류 (${parentId}):`, error)
    return []
  }
}

/**
 * 로그인 시 특정 부모 코드의 하위 레벨을 가져와서 localStorage에 저장
 */
export const loadSysCodeOnLogin = async (parentId: string): Promise<void> => {
  try {
    const sysCodeData = await fetchSysCodeByParent(parentId)
    if (sysCodeData.length > 0) {
      setSysCodeToCache(parentId, sysCodeData)
    }
  } catch (error) {
    console.error(`로그인 시 시스템 코드 로드 실패 (${parentId}):`, error)
  }
}

/**
 * localStorage에 sysCodeData가 없거나 만료되었으면 전체 syscode 로드 (접속 시 호출)
 * 클라이언트에서만 호출 (typeof window !== 'undefined')
 */
export const ensureSysCodeLoaded = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  try {
    const cached = getSysCodeFromCache(SYSCODE_PARENT_IDS[0])
    if (cached && cached.length > 0) return // 이미 유효한 캐시 있음
    for (const parentId of SYSCODE_PARENT_IDS) {
      await loadSysCodeOnLogin(parentId)
    }
  } catch (error) {
    console.error('sysCode 초기 로드 실패:', error)
  }
}

/** 캐시 우선으로 syscode 조회 (없으면 API 호출 후 캐시) */
export const getSysCode = async (sysCodeGubn: string): Promise<SysCodeItem[]> => {
  const cached = getSysCodeFromCache(sysCodeGubn)
  if (cached?.length) return cached
  const apiData = await fetchSysCodeFromAPI(sysCodeGubn)
  if (apiData.length > 0) setSysCodeToCache(sysCodeGubn, apiData)
  return apiData
}

export const getSysCodeName = (sysCodeList: SysCodeItem[], sysCodeValue: string): string => {
  const item =
    sysCodeList.find((c) => c.sysCodeSid === sysCodeValue) ??
    sysCodeList.find((c) => c.sysCodeValue === sysCodeValue)
  return item ? item.sysCodeName : sysCodeValue
}

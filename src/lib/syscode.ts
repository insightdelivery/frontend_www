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

/** 아티클 카테고리 부모 코드 (localStorage sysCodeData 키, list.me §5) */
export const ARTICLE_CATEGORY_PARENT = 'SYS26209B002'

/** 아티클 하이라이트 상수 부모 코드 (localStorage sysCodeData, articleHightlightPlan 15.13) */
export const ARTICLE_HIGHLIGHT_PARENT = 'SYS26312B001'

/**
 * 콘텐츠 저작권 문구 등 (localStorage.md §2.1) — 하위 B003~B005
 * 추천 검색어는 시스코드 미사용 → `fetchRecommendedSearchKeywords()` (recommendedSearchKeywords.ts)
 */
export const SYSCODE_SITE_COPY_PARENT = 'SYS26324B001'

/** Display Event — eventTypeCode (eventBannerPlan) */
export const DISPLAY_EVENT_TYPE_PARENT = 'SYS26320B003'
/** Display Event — contentTypeCode */
export const DISPLAY_CONTENT_TYPE_PARENT = 'SYS26320B009'

/** 로그인 시 및 접속 시 공통으로 로드하는 부모 코드 ID 목록 */

export const SYSCODE_PARENT_IDS = [
  ARTICLE_CATEGORY_PARENT, // 아티클 카테고리
  DISPLAY_EVENT_TYPE_PARENT,
  DISPLAY_CONTENT_TYPE_PARENT,
  'SYS26127B017', // 회원가입 지역
  'SYS26127B018', // 회원 가입 지역 국내
  'SYS26127B019', // 회원 가입 지역 해외
  'SYS26127B006', // 직분 코드
  'SYS26209B020', // 아티클 발행정보
  'SYS26209B015', // 아티클 공개범위설정
  'SYS26312B001', // 아티클 하이라이트
  SYSCODE_SITE_COPY_PARENT, // 저작권 문구 B003~B005 (localStorage.md)
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

function mapRawToSysCodeItem(item: Record<string, unknown>): SysCodeItem {
  return {
    sysCodeSid: String(item.sysCodeSid ?? ''),
    sysCodeName: String(item.sysCodeName ?? ''),
    sysCodeValue: String(item.sysCodeVal ?? item.sysCodeValue ?? item.sysCodeSid ?? ''),
    sysCodeSort: Number(item.sysCodeSort ?? 0),
    sysCodeUseFlag: String(item.sysCodeUse ?? item.sysCodeUseFlag ?? 'Y'),
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
    return (syscodeList as Record<string, unknown>[]).map((item: Record<string, unknown>) =>
      mapRawToSysCodeItem(item)
    )
  } catch (error) {
    console.error(`syscode API 호출 오류 (${sysCodeGubn}):`, error)
    return []
  }
}

// by_parent API로 하위 시스템 코드 조회 (공개 API — Hero eventType 자동 해석 등)
export const fetchSysCodeByParent = async (parentId: string): Promise<SysCodeItem[]> => {
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
    return (syscodeList as Record<string, unknown>[]).map((item: Record<string, unknown>) =>
      mapRawToSysCodeItem(item)
    )
  } catch (error) {
    console.error(`syscode by_parent API 오류 (${parentId}):`, error)
    return []
  }
}

/**
 * bulk API로 여러 부모 코드의 직계 자식을 한 번에 조회 (API 1회)
 */
const fetchSysCodeBulk = async (
  parentIds: readonly string[]
): Promise<Record<string, SysCodeItem[]>> => {
  if (parentIds.length === 0) return {}
  try {
    const response = await apiClient.get('/systemmanage/syscode/bulk/', {
      params: { parent_ids: parentIds.join(',') },
    })
    let data: Record<string, unknown[]> = {}
    if (response.data?.IndeAPIResponse?.ErrorCode === '00' && response.data?.IndeAPIResponse?.Result != null) {
      data = response.data.IndeAPIResponse.Result as Record<string, unknown[]>
    } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      data = response.data as Record<string, unknown[]>
    }
    const result: Record<string, SysCodeItem[]> = {}
    for (const pid of parentIds) {
      const rawList = data[pid]
      result[pid] = Array.isArray(rawList)
        ? (rawList as Record<string, unknown>[]).map(mapRawToSysCodeItem)
        : []
    }
    return result
  } catch (error) {
    console.error('syscode bulk API 오류:', error)
    return {}
  }
}

/**
 * 로그인 시 특정 부모 코드의 하위 레벨을 가져와서 localStorage에 저장
 * API가 빈 배열을 줘도 저장함(하위가 없는 부모는 []로 저장해 "로드 완료"로 둠)
 */
export const loadSysCodeOnLogin = async (parentId: string): Promise<void> => {
  try {
    const sysCodeData = await fetchSysCodeByParent(parentId)
    setSysCodeToCache(parentId, sysCodeData)
  } catch (error) {
    console.error(`로그인 시 시스템 코드 로드 실패 (${parentId}):`, error)
  }
}

/**
 * SYSCODE_PARENT_IDS 전체를 bulk API 1회로 로드하여 localStorage에 저장
 * 로그인 성공 후·ensureSysCodeLoaded에서 사용
 */
export const loadAllSysCodesOnLogin = async (): Promise<void> => {
  try {
    const data = await fetchSysCodeBulk(SYSCODE_PARENT_IDS)
    for (const parentId of SYSCODE_PARENT_IDS) {
      setSysCodeToCache(parentId, data[parentId] ?? [])
    }
  } catch (error) {
    console.error('sysCode 일괄 로드 실패:', error)
  }
}

/**
 * localStorage에 sysCodeData가 없거나 만료되었으면 전체 syscode 로드 (접속 시 호출)
 * bulk API 1회로 로드. "로드 완료"는 캐시에 키가 있는지로 판단 (빈 배열도 저장)
 * 클라이언트에서만 호출 (typeof window !== 'undefined')
 */
export const ensureSysCodeLoaded = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  try {
    const allCached = SYSCODE_PARENT_IDS.every(
      (id) => getSysCodeFromCache(id) !== null
    )
    if (allCached) return
    await loadAllSysCodesOnLogin()
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


/** 마이페이지 회원정보 수정 — 비밀번호 확인 후 같은 탭 세션에서만 유지 */
export const MYPAGE_INFO_UNLOCK_PREFIX = 'inde_mypage_info_unlocked_'

export function mypageInfoUnlockStorageKey(userId: string | number): string {
  return `${MYPAGE_INFO_UNLOCK_PREFIX}${userId}`
}

export function clearMypageProfileUnlockFlags(): void {
  if (typeof window === 'undefined') return
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i)
    if (k?.startsWith(MYPAGE_INFO_UNLOCK_PREFIX)) {
      sessionStorage.removeItem(k)
    }
  }
}

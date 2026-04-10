/** 현재 pathname에 해당하는 마이페이지 탭 활성 여부 (MypageShell · MypageScrollTabs 공통) */
export function isMypageTabActive(pathname: string | null, tabPath: string): boolean {
  const p = (pathname ?? '').replace(/\/$/, '')
  if (p === tabPath) return true
  if (tabPath === '/mypage/info' && (p === '/mypage' || p === '/mypage/info')) return true
  if (tabPath === '/mypage/support' && p.startsWith('/mypage/support')) return true
  return false
}

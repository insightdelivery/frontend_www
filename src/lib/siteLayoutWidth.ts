/**
 * 사이트 가로 레이아웃
 * - **GNB**(MainBar·Header·검색 패널 inner): **900px** (`siteShellMaxWidthClass`)
 * - **푸터 다크(홈) 내부**: **840px** (`siteFooterInnerMaxWidthClass`)
 * - **홈 메인 레일**: **840px** (`SITE_HOME_RAIL_MAX_CLASS`)
 */
export const SITE_FOOTER_INNER_MAX_CLASS = 'max-w-[840px]' as const

export const SITE_HOME_RAIL_MAX_CLASS = 'max-w-[840px]' as const

/** TopButton·Kakao·GNB·아티클 목록 등 */
export const SITE_SHELL_MAX_CLASS = 'max-w-[900px]' as const

export function siteShellMaxWidthClass(_pathname?: string | null): typeof SITE_SHELL_MAX_CLASS {
  return SITE_SHELL_MAX_CLASS
}

export function siteFooterInnerMaxWidthClass(): typeof SITE_FOOTER_INNER_MAX_CLASS {
  return SITE_FOOTER_INNER_MAX_CLASS
}

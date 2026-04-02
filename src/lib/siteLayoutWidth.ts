/**
 * 사이트 가로 최대 너비 — `_docsRules/1_planDoc/wwwLayoutPlan.md`
 * - **GNB·Footer·검색 패널**: 항상 **900px** (`pathname` 무관)
 * - **페이지 본문**: 아티클 **상세**(`/article/detail?id=`)만 본문 컴포넌트가 자체 폭(예: 720px), 그 외 **900px**
 */
export const SITE_SHELL_MAX_CLASS = 'max-w-[900px]' as const

/** Header · MainBar · Footer · 검색 패널 inner — 항상 900px */
export function siteShellMaxWidthClass(_pathname?: string | null): typeof SITE_SHELL_MAX_CLASS {
  return SITE_SHELL_MAX_CLASS
}

/** wwwMainpagePlan.md / inde_redesign_prototype — 홈 에디토리얼 공통 유틸 클래스 */

export const editorialEase = '[transition-timing-function:cubic-bezier(.2,.6,.2,1)]'

/** 썸네일 이미지 — subtle zoom */
export const editorialThumbHover =
  `transition-transform duration-[600ms] ${editorialEase} will-change-transform group-hover:scale-[1.03]`

/** 카드 전체 — 살짝 상승 */
export const editorialCardLift =
  `transition-transform duration-[250ms] ${editorialEase} group-hover:-translate-y-[3px]`

/** 카테고리 배지 — 썸네일 좌상단, 흰 배경, r3 */
export const editorialCatBadge =
  'absolute left-3 top-3 z-[2] bg-white text-[11px] font-bold tracking-[0.06em] text-[#0f0f0f] px-[9px] py-[5px] rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'

export const editorialSectionHeadBorder = 'border-b border-[#E8E5DD] pb-4 mb-12'

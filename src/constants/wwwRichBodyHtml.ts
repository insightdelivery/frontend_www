/**
 * 관리자 RichTextEditor(TipTap) HTML 본문을 www에서 보여 줄 때 공통 타이포.
 * 공지 상세(`notice-detail-body`)와 동일 규칙 — 회사소개 등 홈페이지 문서 본문에도 사용한다.
 */
export const WWW_RICH_BODY_INNERHTML_BASE_CLASS =
  'max-w-none text-[18px] font-normal leading-[32.4px] tracking-normal text-[#444444] [&_a]:text-[#444444] [&_a]:underline [&_p]:mb-4 [&_p]:text-[18px] [&_p]:leading-[32.4px] [&_p]:text-[#444444] [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:pl-5 [&_li]:my-1 [&_img]:max-w-full [&_img]:h-auto'

/** 회사소개 등: 에디터가 남긴 완전 빈 `<p></p>`만 숨겨 불필요한 세로 여백 제거 (공지와 동일 본문 타이포 위에 얹음) */
export const WWW_HOMEPAGE_DOC_BODY_EXTRA_CLASS = '[&_p:empty]:hidden'

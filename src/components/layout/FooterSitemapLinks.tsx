'use client'

import Link from 'next/link'

export type FooterSitemapLinksLayout = 'footer' | 'gnbDrawer'

type Props = {
  recruitHref: string
  partnershipHref: string
  layout?: FooterSitemapLinksLayout
  /** GNB 등 — 링크 클릭 후 드로어 닫기 */
  onNavigate?: () => void
}

/**
 * 풋터 모바일 2열과 동일한 「소개」「서비스」 링크 묶음.
 * - `footer`: 부모가 `md:contents` 그리드일 때 자식 `md:col-span-1` 적용
 * - `gnbDrawer`: GNB 햄버거 전용 — md 분할 클래스 없음
 */
export default function FooterSitemapLinks({
  recruitHref,
  partnershipHref,
  layout = 'footer',
  onNavigate,
}: Props) {
  const col =
    layout === 'footer' ? 'min-w-0 md:col-span-1' : 'min-w-0'
  const titleClass =
    layout === 'gnbDrawer'
      ? 'text-[12px] font-extrabold text-gray-800'
      : 'text-[12px] font-extrabold text-gray-700'
  const linkClass =
    layout === 'gnbDrawer'
      ? 'text-[13px] font-medium text-gray-700 transition-opacity hover:opacity-70'
      : 'text-[12px] text-gray-600 hover:text-gray-900 transition-colors'

  return (
    <>
      <div className={col}>
        <p className={titleClass}>소개</p>
        <ul className={layout === 'gnbDrawer' ? 'mt-3 space-y-2.5' : 'mt-4 sm:mt-5 space-y-2'}>
          <li>
            <Link href="/about/companyInfo" className={linkClass} onClick={onNavigate}>
              인디소개
            </Link>
          </li>
          <li>
            {recruitHref ? (
              <a
                href={recruitHref}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                onClick={onNavigate}
              >
                인재채용
              </a>
            ) : (
              <span className={layout === 'gnbDrawer' ? 'text-[13px] text-gray-400' : 'text-gray-400'}>인재채용</span>
            )}
          </li>
          <li>
            {partnershipHref ? (
              <a
                href={partnershipHref}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                onClick={onNavigate}
              >
                광고 및 협업 문의
              </a>
            ) : (
              <span className={layout === 'gnbDrawer' ? 'text-[13px] text-gray-400' : 'text-gray-400'}>
                광고 및 협업 문의
              </span>
            )}
          </li>
          <li>
            <Link href="/about/companyInfo#partners" className={linkClass} onClick={onNavigate}>
              협력 업체
            </Link>
          </li>
        </ul>
      </div>

      <div className={col}>
        <p className={titleClass}>서비스</p>
        <ul className={layout === 'gnbDrawer' ? 'mt-3 space-y-2.5' : 'mt-4 sm:mt-5 space-y-2'}>
          <li>
            <Link href="/notice" className={linkClass} onClick={onNavigate}>
              공지사항
            </Link>
          </li>
          <li>
            <Link href="/faq" className={linkClass} onClick={onNavigate}>
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/mypage/support" className={linkClass} onClick={onNavigate}>
              1:1 문의
            </Link>
          </li>
          <li>
            <Link href="/terms" className={linkClass} onClick={onNavigate}>
              이용약관
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={linkClass} onClick={onNavigate}>
              개인정보처리방침
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}

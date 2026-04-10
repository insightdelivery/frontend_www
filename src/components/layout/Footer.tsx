'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Facebook, Instagram, Youtube, BookOpen } from 'lucide-react'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { siteShellMaxWidthClass } from '@/lib/siteLayoutWidth'

const SNS_LINKS = [
  { href: 'https://www.facebook.com/indemgz/?locale=ko_KR', label: 'Facebook', Icon: Facebook },
  { href: 'https://www.instagram.com/inde_magazine/', label: 'Instagram', Icon: Instagram },
  { href: 'https://www.youtube.com/channel/UCqgFRdCTkW12o9IZGPXgq8A', label: 'YouTube', Icon: Youtube },
  { href: 'https://blog.naver.com/indemgz', label: 'Blog', Icon: BookOpen },
] as const

export default function Footer() {
  const pathname = usePathname()
  const shellMax = siteShellMaxWidthClass(pathname)
  const [externalLinks, setExternalLinks] = useState<{ recruitUrl: string; partnershipUrl: string }>({
    recruitUrl: '',
    partnershipUrl: '',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const doc = await fetchHomepageDocPublic('external_links')
        if (cancelled || !doc?.bodyHtml) return
        const parsed = JSON.parse(doc.bodyHtml) as {
          recruitUrl?: string
          partnershipUrl?: string
        }
        setExternalLinks({
          recruitUrl: typeof parsed.recruitUrl === 'string' ? parsed.recruitUrl : '',
          partnershipUrl: typeof parsed.partnershipUrl === 'string' ? parsed.partnershipUrl : '',
        })
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const recruitHref = useMemo(() => externalLinks.recruitUrl.trim(), [externalLinks.recruitUrl])
  const partnershipHref = useMemo(() => externalLinks.partnershipUrl.trim(), [externalLinks.partnershipUrl])

  return (
    <footer className="mt-8 sm:mt-10 bg-[#F8F8F8]">
      <div className={`mx-auto ${shellMax} px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20`}>
        {/* Top Section - Three Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Left Column - Company Introduction */}
          <div className="md:col-span-2">
            <img
              src="/inde_logo_bottom.png"
              alt="InDe 로고"
              className="h-8 sm:h-10 w-auto"
              style={{
                maxWidth: '100%',
                width: 'auto',
                height: 'auto',
                maxHeight: '40px',
                objectFit: 'contain',
              }}
              // 실제 이미지 크기보다 확대되지 않도록 처리(max-width 100%, max-height 제한)
              // 실제 이미지보다 작은 경우 축소는 가능, 확대는 불가
            />
            <p className="mt-4 sm:mt-5 text-[11px] sm:text-[12px] leading-[1.6] text-gray-600 max-w-full md:max-w-[360px]">
            InDe는 말씀과 삶을 연결하는 크리스천 인사이트 플랫폼으로, 정기적인 콘텐츠를 통해 세상의 개념과 정의를 복음으로 조명하고, 매주 듣는 말씀을 일상의 언어와 시각으로 적용할 수 있도록 돕습니다.
            </p>
            <div className="flex flex-wrap gap-4 mt-5 sm:mt-6 text-[12px] font-normal text-gray-700 tracking-wide">
              {SNS_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] flex-shrink-0" />
                  <span>{label}</span>
                </a>
              ))}
            </div>

          </div>

          {/* 모바일: 소개(왼쪽) | 서비스(오른쪽) 2열 — md+: 상위 4열 그리드에 직접 참여 */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-0 items-start md:contents">
            <div className="min-w-0 md:col-span-1">
              <p className="text-[12px] font-extrabold text-gray-700">소개</p>
              <ul className="mt-4 sm:mt-5 space-y-2 text-[12px] text-gray-600">
                <li><Link href="/about/companyInfo" className="hover:text-gray-900 transition-colors">인디소개</Link></li>
                <li>
                  {recruitHref ? (
                    <a href={recruitHref} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                      인재채용
                    </a>
                  ) : (
                    <span className="text-gray-400">인재채용</span>
                  )}
                </li>
                <li>
                  {partnershipHref ? (
                    <a href={partnershipHref} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                      광고 및 협업 문의
                    </a>
                  ) : (
                    <span className="text-gray-400">광고 및 협업 문의</span>
                  )}
                </li>
                <li>
                  <Link href="/about/companyInfo#partners" className="hover:text-gray-900 transition-colors">
                    협력 업체
                  </Link>
                </li>
              </ul>
            </div>

            <div className="min-w-0 md:col-span-1">
              <p className="text-[12px] font-extrabold text-gray-700">서비스</p>
              <ul className="mt-4 sm:mt-5 space-y-2 text-[12px] text-gray-600">
                <li><Link href="/notice" className="hover:text-gray-900 transition-colors">공지사항</Link></li>
                <li><Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link></li>
                <li><Link href="/mypage/support" className="hover:text-gray-900 transition-colors">1:1 문의</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900 transition-colors">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">개인정보처리방침</Link></li>
                <li><Link href="/membership/checkout" className="hover:text-gray-900 transition-colors">결제</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Middle Separator Line */}
        <div className="mt-8 sm:mt-12 md:mt-14 border-t border-gray-200"></div>

        {/* 1행: (주)원소울 | SNS 두 영역 / 2행 이하: 사업자·주소·저작권 전체 너비 1블록 */}
        <div className="mt-5 sm:mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <p className="m-0 shrink-0 text-left text-[12px] leading-relaxed text-gray-700 font-semibold">(주)원소울</p>
          </div>

          <div className="mt-2 w-full space-y-2 text-left text-[12px] leading-relaxed text-gray-700">
            <p className="m-0 p-0 break-words">
              <strong className="font-semibold text-gray-700">사업자등록번호</strong> : 203-87-02097{' '}
              <span className="text-gray-500">|</span>{' '}
              <strong className="font-semibold text-gray-700">통신판매업신고</strong> : 제2025-서울성동-1533호{' '}
              <span className="text-gray-500">|</span>{' '}
              <strong className="font-semibold text-gray-700">개인정보책임자</strong> : 조나영
            </p>
            <p className="m-0 p-0 break-words">
              <strong className="font-semibold text-gray-700">주소</strong> : 서울특별시 성동구 광나루로8길 31, 2동 301호(성수동2가, 성수SKV1센터){' '}
              <span className="text-gray-500">|</span>{' '}
              <strong className="font-semibold text-gray-700">이메일</strong> : indemgz@gmail.com{' '}
              <span className="text-gray-500">|</span>{' '}
              <strong className="font-semibold text-gray-700">대표이사</strong> : 조광식
            </p>
            <p className="m-0 p-0 pt-1 text-[12px] text-gray-400">&copy; 2024 InDe. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}


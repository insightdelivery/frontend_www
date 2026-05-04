'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { siteShellMaxWidthClass } from '@/lib/siteLayoutWidth'
import FooterSitemapLinks from '@/components/layout/FooterSitemapLinks'
import NewsletterModal from '@/components/newsletter/NewsletterModal'

const SNS_LINKS = [
  { href: 'https://www.facebook.com/indemgz/?locale=ko_KR', label: 'Facebook', Icon: Facebook },
  { href: 'https://www.instagram.com/inde_sight_/', label: 'Instagram', Icon: Instagram },
  { href: 'https://www.youtube.com/channel/UCqgFRdCTkW12o9IZGPXgq8A', label: 'YouTube', Icon: Youtube },
  { href: 'https://pf.kakao.com/_NwxgPn', label: '카카오톡 채널', Icon: MessageCircle },
] as const

export default function Footer() {
  const pathname = usePathname()
  const shellMax = siteShellMaxWidthClass(pathname)
  const [externalLinks, setExternalLinks] = useState<{ recruitUrl: string; partnershipUrl: string }>({
    recruitUrl: '',
    partnershipUrl: '',
  })
  const [openNewsletterModal, setOpenNewsletterModal] = useState(false)

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
      <NewsletterModal open={openNewsletterModal} onClose={() => setOpenNewsletterModal(false)} />
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
            InDe는 교회에서 들은 말씀을 실제 삶으로 이어갈 수 있도록, 시의적이고도 핫한 콘텐츠로 신앙 인사이트 루틴 형성을 돕습니다.
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
            <FooterSitemapLinks
              recruitHref={recruitHref}
              partnershipHref={partnershipHref}
              layout="footer"
              onNewsletterClick={() => setOpenNewsletterModal(true)}
            />
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


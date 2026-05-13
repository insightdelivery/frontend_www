'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { siteFooterInnerMaxWidthClass } from '@/lib/siteLayoutWidth'
import FooterSitemapLinks from '@/components/layout/FooterSitemapLinks'
import NewsletterModal from '@/components/newsletter/NewsletterModal'

const SNS_LINKS = [
  { href: 'https://www.facebook.com/indemgz/?locale=ko_KR', label: 'Facebook' },
  { href: 'https://www.instagram.com/inde_sight_/', label: 'Instagram' },
  { href: 'https://www.youtube.com/channel/UCqgFRdCTkW12o9IZGPXgq8A', label: 'YouTube' },
  { href: 'https://pf.kakao.com/_NwxgPn', label: '카카오톡 채널' },
] as const

export default function Footer() {
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

  const innerMax = siteFooterInnerMaxWidthClass()

  return (
    <footer className="mt-20 w-full bg-footer-dark pb-12 pt-20 text-[14px] text-white/65 max-sm:px-5">
      <NewsletterModal open={openNewsletterModal} onClose={() => setOpenNewsletterModal(false)} />
      <div className={`mx-auto ${innerMax} px-0`}>
        <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-12 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
          <div>
            <img
              src="/inde_logo_bottom.png"
              alt="InDe 로고"
              className="h-8 w-auto brightness-[1.45] saturate-110 contrast-[1.06] sm:h-10"
              style={{ maxHeight: '40px', objectFit: 'contain' }}
            />
            <p className="mt-4 max-w-[36ch] text-[13px] leading-relaxed text-white/60 sm:mt-5">
              InDe는 교회에서 들은 말씀을 실제 삶으로 이어갈 수 있도록, 시의적이고도 핫한 콘텐츠로 신앙 인사이트 루틴 형성을 돕습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {SNS_LINKS.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center rounded-full border border-white/[0.18] px-3 text-[12px] font-medium text-white/70 transition-colors hover:border-white/[0.45] hover:text-white"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <FooterSitemapLinks
            recruitHref={recruitHref}
            partnershipHref={partnershipHref}
            layout="footer"
            tone="dark"
            onNewsletterClick={() => setOpenNewsletterModal(true)}
          />
        </div>

        <div className="pt-12 text-[12px] leading-[1.7] text-white/40">
          <div className="mb-2 text-[13px] font-bold text-white/70">(주)원소울</div>
          <span className="mb-1 block">
            <b className="mr-1 font-medium text-white/60">사업자등록번호</b> 203-87-02097{' '}
            <span className="text-white/25">|</span> <b className="ml-1 mr-1 font-medium text-white/60">통신판매업신고</b>{' '}
            제2025-서울성동-1533호 <span className="text-white/25">|</span>{' '}
            <b className="ml-1 mr-1 font-medium text-white/60">개인정보책임자</b> 조나영
          </span>
          <span className="mb-1 block">
            <b className="mr-1 font-medium text-white/60">주소</b> 서울특별시 성동구 광나루로8길 31, 2동 301호 (성수동2가, 성수SKV1센터)
          </span>
          <span className="mb-1 block">
            <b className="mr-1 font-medium text-white/60">이메일</b> indemgz@gmail.com <span className="text-white/25">|</span>{' '}
            <b className="ml-1 mr-1 font-medium text-white/60">대표이사</b> 조광식
          </span>
          <div className="mt-5 border-t border-white/[0.08] pt-4 text-[12px] text-white/35">
            © 2024 InDe. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

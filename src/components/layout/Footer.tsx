'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Youtube, BookOpen } from 'lucide-react'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'

const SNS_LINKS = [
  { href: 'https://www.facebook.com/indemgz/?locale=ko_KR', label: 'Facebook', Icon: Facebook },
  { href: 'https://www.instagram.com/inde_magazine/', label: 'Instagram', Icon: Instagram },
  { href: 'https://www.youtube.com/channel/UCqgFRdCTkW12o9IZGPXgq8A', label: 'YouTube', Icon: Youtube },
  { href: 'https://blog.naver.com/indemgz', label: 'Blog', Icon: BookOpen },
] as const

export default function Footer() {
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
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20">
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
          </div>

          {/* Middle Column - Site Menu */}
          <div className="md:col-span-1">
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
              <li><Link href="/" className="hover:text-gray-900 transition-colors">협력 업체</Link></li>
            </ul>
          </div>

          {/* Right Column - Customer Support (공지사항, FAQ, 1:1 문의 + SNS) */}
          <div className="md:col-span-1">
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

        {/* Middle Separator Line */}
        <div className="mt-8 sm:mt-12 md:mt-14 border-t border-gray-200"></div>

        {/* Bottom Section */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          {/* Left Side - Company Legal and Contact Information */}
          <div className="space-y-2 text-[12px] sm:text-[14px] text-gray-700">
            <p className="break-words">
              사업자등록번호 : 203-87-02097 | 통신판매업신고 : 제2025-서울성동-1533호 | 개인정보책임자 : 조나영
            </p>
            <p className="break-words">
            서울특별시 성동구 광나루로8길 31, 2동 301호(성수동2가, 성수SKV1센터) I 이메일: indemgz@gmail.com | 대표이사 : 조광식 
            </p>
            <p className="mt-3 sm:mt-4">Copyright ⓒ 2024. InDe All Rights Reserved</p>
          </div>

          {/* Right Side - Social Media Links */}
          <div className="flex flex-wrap gap-4 sm:gap-6 text-[12px] sm:text-[14px] font-normal text-gray-700 tracking-wide flex-shrink-0 items-center">
            {SNS_LINKS.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gray-900 transition-colors" aria-label={label}>
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] flex-shrink-0" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}


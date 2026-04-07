'use client'

import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { HomepageDocContentModal, type RegisterLegalDocType } from './HomepageDocContentModal'
import { RegisterInfoModal } from './RegisterInfoModal'

/** `/terms`·`/privacy` 페이지와 동일 `doc_type` (wwwDocEtc.md) */
const TERMS_ITEMS = [
  { name: 'age_agree' as const, required: true as const, label: '만 14세 이상입니다' },
  {
    name: 'terms_agree' as const,
    required: true as const,
    label: '이용약관',
    contentDocType: 'terms_of_service' as const satisfies RegisterLegalDocType,
  },
  {
    name: 'privacy_agree' as const,
    required: true as const,
    label: '개인정보 수집 및 이용',
    contentDocType: 'privacy_policy' as const satisfies RegisterLegalDocType,
  },
  {
    name: 'newsletter_agree' as const,
    required: false as const,
    label: '뉴스레터 및 이벤트/혜택 정보 수신 동의',
    showNewsletterGuide: true as const,
  },
] as const

interface TermsAgreementProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
}

export function TermsAgreement({ register, errors, watch: _watch, setValue }: TermsAgreementProps) {
  const [legalModal, setLegalModal] = useState<RegisterLegalDocType | null>(null)
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false)

  const allAgreeRegister = register('terms_all_agree', {
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      if (!setValue) return
      const checked = e.target.checked
      for (const item of TERMS_ITEMS) {
        setValue(item.name, checked, { shouldValidate: true, shouldDirty: true })
      }
    },
  })

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="terms_all_agree"
          {...allAgreeRegister}
          className="h-5 w-5 rounded border-gray-300 text-gray-700 focus:ring-gray-300 flex-shrink-0"
        />
        <Label htmlFor="terms_all_agree" className="text-base font-bold text-gray-900 cursor-pointer flex-1 flex items-center gap-1">
          이용약관 전체 동의
          <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden />
        </Label>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 space-y-3 pl-8">
        {TERMS_ITEMS.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                {...register(item.name)}
                className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-300 flex-shrink-0"
              />
              <span className="text-sm text-gray-800">
                {item.required ? (
                  <span className="text-gray-500">(필수)</span>
                ) : (
                  <span className="text-gray-500">(선택)</span>
                )}{' '}
                {item.label}
              </span>
            </label>
            {'contentDocType' in item && item.contentDocType ? (
              <button
                type="button"
                className="text-sm text-gray-500 underline hover:text-gray-700 flex-shrink-0"
                onClick={() => setLegalModal(item.contentDocType)}
              >
                내용보기
              </button>
            ) : 'showNewsletterGuide' in item && item.showNewsletterGuide ? (
              <button
                type="button"
                className="text-sm text-gray-500 underline hover:text-gray-700 flex-shrink-0"
                onClick={() => setNewsletterModalOpen(true)}
              >
                내용보기
              </button>
            ) : null}
          </div>
        ))}
        <p className="text-xs text-gray-500 pl-6">
          뉴스레터를 구독하면 콘텐츠 큐레이션을 받을 수 있습니다.
        </p>
      </div>


      {(errors.age_agree || errors.terms_agree || errors.privacy_agree) && (
        <p className="text-sm text-red-600">
          필수 약관에 모두 동의해 주세요.
        </p>
      )}

      {legalModal ? (
        <HomepageDocContentModal
          open={Boolean(legalModal)}
          docType={legalModal}
          onClose={() => setLegalModal(null)}
        />
      ) : null}

      <RegisterInfoModal
        open={newsletterModalOpen}
        onClose={() => setNewsletterModalOpen(false)}
        title="뉴스레터 및 이벤트·혜택 정보 수신 안내"
      >
        <p className="mb-6 text-gray-800">
          InDe에서 제공하는 이벤트 및 혜택 등 다양한 정보를 뉴스레터, 문자메시지, 이메일, 알림톡 등으로 받아보실 수
          있습니다. 마케팅 정보 수신 및 활용 동의 여부와 관계없이 회원가입 및 서비스를 이용하실 수 있습니다. 또한
          서비스의 중요 안내사항 및 결제/모임에 대한 정보는 마케팅 정보 수신 동의 여부와 관계없이 발송됩니다.
        </p>

        <section className="space-y-4 border-t border-gray-100 pt-4">
          <h3 className="text-[15px] font-bold text-gray-900">1. 뉴스레터</h3>
          <div className="space-y-3 pl-0.5">
            <div>
              <p className="font-semibold text-gray-800">① 수집 · 이용목적</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                <li>개인 맞춤형 콘텐츠 큐레이션 제공</li>
                <li>정보성 혹은 프로모션용 안내</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-800">② 수집 · 이용항목</p>
              <p className="mt-1 pl-0 text-gray-700">회원 정보(이름, 이메일, 가입일시, 회원구분)</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">③ 보유 및 이용 기간</p>
              <p className="mt-1 text-gray-700">정보 삭제 또는 이용 정지 요청 및 회원탈퇴 시 즉시 삭제</p>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-4 border-t border-gray-100 pt-4">
          <h3 className="text-[15px] font-bold text-gray-900">2. 이벤트/혜택 정보</h3>
          <div className="space-y-3 pl-0.5">
            <div>
              <p className="font-semibold text-gray-800">① 수집 · 이용목적</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                <li>상품 · 서비스 개발 연구</li>
                <li>고객에 대한 편의 제공</li>
                <li>사은 · 판촉행사 등의 마케팅 활용</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-800">② 수집 · 이용항목</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                <li>회원 정보(이름, 휴대폰 번호, 이메일, 가입일시, 배송지, 회원구분)</li>
                <li>폴인 멤버십 이용 정보(멤버십 상품명, 가입일시)</li>
                <li>결제 및 서비스 이용 정보(상품, 결제일)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-800">③ 보유 및 이용 기간</p>
              <p className="mt-1 text-gray-700">정보 삭제 또는 이용 정지 요청 및 회원탈퇴 시 즉시 삭제</p>
            </div>
          </div>
        </section>
      </RegisterInfoModal>
    </section>
  )
}

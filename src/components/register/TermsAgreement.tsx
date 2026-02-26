'use client'

import { useEffect } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Label } from '@/components/ui/label'

const TERMS_ITEMS = [
  { name: 'age_agree', required: true, label: '만 14세 이상입니다' },
  { name: 'terms_agree', required: true, label: '이용약관' },
  { name: 'privacy_agree', required: true, label: '개인정보 수집 및 이용' },
  { name: 'newsletter_agree', required: false, label: '무료 뉴스레터 및 이벤트/혜택 정보 수신 동의' },
] as const

interface TermsAgreementProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
}

export function TermsAgreement({ register, errors, watch, setValue }: TermsAgreementProps) {
  const termsAllAgree = watch('terms_all_agree')

  // 전체 동의 체크 시 필수 3개 동의
  useEffect(() => {
    if (!setValue) return
    if (termsAllAgree) {
      setValue('age_agree', true)
      setValue('terms_agree', true)
      setValue('privacy_agree', true)
    }
  }, [termsAllAgree, setValue])

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms_all_agree"
          {...register('terms_all_agree')}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-black focus:ring-black/20"
        />
        <Label htmlFor="terms_all_agree" className="text-base font-bold text-gray-900 cursor-pointer flex-1">
          이용약관 전체 동의합니다.
        </Label>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50/50 p-4 space-y-3">
        {TERMS_ITEMS.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                {...register(item.name)}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20 flex-shrink-0"
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
            <button
              type="button"
              className="text-sm text-gray-500 underline hover:text-gray-700 flex-shrink-0"
            >
              내용보기
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        뉴스레터를 구독하면 콘텐츠 큐레이션을 받을 수 있습니다.
      </p>

      {(errors.age_agree || errors.terms_agree || errors.privacy_agree) && (
        <p className="text-sm text-red-600">
          필수 약관에 모두 동의해 주세요.
        </p>
      )}
    </section>
  )
}

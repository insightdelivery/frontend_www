'use client'

import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { AdditionalInfoInput } from './AdditionalInfoInput'
import { TermsAgreement } from './TermsAgreement'

interface RegisterFormLowerProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
}

/**
 * 회원가입·complete-profile 하단 (분할선 아래)
 * - 추가 정보: snsUserJoin §6 — 직분·생년월일·지역·해외거주 UI 없음 (`AdditionalInfoInput`는 null)
 * - 이용약관 전체 동의
 */
export function RegisterFormLower({ register, errors, watch, setValue }: RegisterFormLowerProps) {
  return (
    <div className="space-y-8">
      {/* 페이지 분할 라인 */}
      <hr className="border-t border-gray-300" />

      {/* 추가 정보 입력 (선택) */}
      <AdditionalInfoInput register={register} errors={errors} watch={watch} setValue={setValue} />

      {/* 이용약관 전체 동의 */}
      <TermsAgreement register={register} errors={errors} watch={watch} setValue={setValue} />
    </div>
  )
}

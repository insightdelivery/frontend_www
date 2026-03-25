'use client'

import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'

/** @deprecated snsUserJoin §6 — 직분·생년월일·지역·해외거주는 가입 단계에서 수집하지 않음. 타입만 호환용으로 유지. */
export interface AdditionalInfoFormValues {
  position?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  region?: string
  is_overseas?: boolean
}

interface AdditionalInfoInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shared with RegisterFormLower / register & complete-profile forms
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
}

/**
 * 회원가입·complete-profile 하단 “추가 정보” 블록.
 * snsUserJoin §6: 직분·생년월일·지역·해외거주 UI 비노출 — 제출 시 상위 페이지에서 빈 값으로 전송.
 */
export function AdditionalInfoInput(_props: AdditionalInfoInputProps) {
  return null
}

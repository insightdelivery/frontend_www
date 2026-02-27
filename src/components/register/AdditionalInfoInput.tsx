'use client'

import { useEffect, useState } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { getSysCodeFromCache, type SysCodeItem } from '@/lib/syscode'
import { REGION_DOMESTIC_PARENT, REGION_FOREIGN_PARENT, POSITION_PARENT } from '@/lib/syscode'

const YEARS = Array.from({ length: 80 }, (_, i) => 2025 - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export interface AdditionalInfoFormValues {
  position?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  region?: string
  is_overseas?: boolean
}

interface AdditionalInfoInputProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
}

function toOptions(list: SysCodeItem[]) {
  const sorted = [...list]
    .filter((c) => c.sysCodeUseFlag === 'Y')
    .sort((a, b) => a.sysCodeSort - b.sysCodeSort)
  return [
    { value: '', label: '선택하세요' },
    ...sorted.map((c) => ({ value: c.sysCodeSid, label: c.sysCodeName })),
  ]
}

export function AdditionalInfoInput({ register, errors, watch, setValue }: AdditionalInfoInputProps) {
  const [positionOptions, setPositionOptions] = useState<{ value: string; label: string }[]>([])
  const [regionDomesticOptions, setRegionDomesticOptions] = useState<{ value: string; label: string }[]>([])
  const [regionForeignOptions, setRegionForeignOptions] = useState<{ value: string; label: string }[]>([])

  const isOverseas = watch('is_overseas')

  // 국내/해외 전환 시 지역 초기화. 해외 선택 시에는 지역 비활성화·null
  useEffect(() => {
    if (setValue) setValue('region', '')
  }, [isOverseas, setValue])

  // sysCodeData(localStorage)에서만 로드, API 호출 없음
  useEffect(() => {
    const positionList = getSysCodeFromCache(POSITION_PARENT) ?? []
    const domesticList = getSysCodeFromCache(REGION_DOMESTIC_PARENT) ?? []
    const foreignList = getSysCodeFromCache(REGION_FOREIGN_PARENT) ?? []
    setPositionOptions(toOptions(positionList))
    setRegionDomesticOptions(toOptions(domesticList))
    setRegionForeignOptions(toOptions(foreignList))
  }, [])

  const regionOptions = isOverseas ? regionForeignOptions : regionDomesticOptions
  const regionPlaceholder = isOverseas ? '해외 지역을 선택하세요' : '국내 지역을 선택하세요'

  const selectClass =
    'flex h-12 w-full appearance-none rounded-lg border-0 bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300'

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900">
        추가 정보 입력 (선택)
      </h3>

      <div>
        <Label htmlFor="position" className="text-gray-900">직분</Label>
        <div className="relative mt-1.5">
          <select
            id="position"
            {...register('position')}
            className={selectClass}
          >
            <option value="">직분을 선택하세요</option>
            {positionOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <Label className="text-gray-900">생년월일</Label>
        <div className="mt-1.5 flex gap-2">
          <div className="relative flex-1">
            <select
              {...register('birth_year', { valueAsNumber: true })}
              className={selectClass}
            >
              <option value="">년</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <select
              {...register('birth_month', { valueAsNumber: true })}
              className={selectClass}
            >
              <option value="">월</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <select
              {...register('birth_day', { valueAsNumber: true })}
              className={selectClass}
            >
              <option value="">일</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="region" className="text-gray-900">지역</Label>
        <div className="relative mt-1.5">
          <select
            id="region"
            {...register('region')}
            disabled={isOverseas}
            className={selectClass + ' disabled:opacity-60 disabled:cursor-not-allowed'}
          >
            <option value="">
              {isOverseas ? '해외 거주 시 선택 불가' : '지역을 선택하세요'}
            </option>
            {regionOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
        <label className="mt-2 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('is_overseas')}
            className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-300"
          />
          <span className="text-sm text-gray-600">해외거주자라면 체크하세요.</span>
        </label>
      </div>
    </section>
  )
}

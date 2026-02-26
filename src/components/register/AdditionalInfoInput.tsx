'use client'

import { useEffect, useState } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { getSysCode, type SysCodeItem } from '@/lib/syscode'
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

  useEffect(() => {
    getSysCode(POSITION_PARENT).then((list) => setPositionOptions(toOptions(list)))
    getSysCode(REGION_DOMESTIC_PARENT).then((list) => setRegionDomesticOptions(toOptions(list)))
    getSysCode(REGION_FOREIGN_PARENT).then((list) => setRegionForeignOptions(toOptions(list)))
  }, [])

  const regionOptions = isOverseas ? regionForeignOptions : regionDomesticOptions
  const regionPlaceholder = isOverseas ? '해외 지역을 선택하세요' : '국내 지역을 선택하세요'

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">추가 정보 입력</span>
        <span className="text-gray-500 font-normal ml-1">(선택)</span>
      </h3>

      <div>
        <Label htmlFor="position" className="text-gray-700">
          직분
        </Label>
        <div className="relative mt-1">
          <select
            id="position"
            {...register('position')}
            className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            <option value="">직분을 선택하세요</option>
            {positionOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <Label className="text-gray-700">생년월일</Label>
        <div className="mt-1 flex gap-2">
          <div className="relative flex-1">
            <select
              {...register('birth_year', { valueAsNumber: true })}
              className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">년</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <select
              {...register('birth_month', { valueAsNumber: true })}
              className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">월</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <select
              {...register('birth_day', { valueAsNumber: true })}
              className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">일</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="mt-2 flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            {...register('is_overseas')}
            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
          />
          <span className="text-sm text-gray-600">해외거주자라면 체크하세요.</span>
        </label>
        <Label htmlFor="region" className="text-gray-700">
          지역
        </Label>
        <div className="relative mt-1">
          <select
            id="region"
            {...register('region')}
            disabled={isOverseas}
            className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="">
              {isOverseas ? '해외 거주 시 선택 불가' : regionPlaceholder}
            </option>
            {regionOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </section>
  )
}

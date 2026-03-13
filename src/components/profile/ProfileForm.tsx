'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { getMe, updateProfile, logout, isAuthenticated } from '@/services/auth'
import { loadSysCodeOnLogin, getSysCodeFromCache, type SysCodeItem } from '@/lib/syscode'
import { POSITION_PARENT, REGION_DOMESTIC_PARENT, REGION_FOREIGN_PARENT } from '@/lib/syscode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WithdrawModal from './WithdrawModal'

const profileSchema = z.object({
  password: z.string().optional(),
  phone: z.string().min(1, '핸드폰 번호를 입력해주세요.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
  nickname: z.string().min(1, '닉네임을 입력해주세요.'),
  position: z.string().optional(),
  birth_year: z.number().min(1900).max(new Date().getFullYear()),
  birth_month: z.number().min(1).max(12),
  birth_day: z.number().min(1).max(31),
  region_type: z.enum(['DOMESTIC', 'FOREIGN']),
  region_domestic: z.string().optional(),
  region_foreign: z.string().optional(),
}).refine((data) => !data.password || data.password.length >= 8, {
  message: '비밀번호는 8자 이상 입력해주세요.',
  path: ['password'],
})

export type ProfileFormData = z.infer<typeof profileSchema>

export type ProfileFormVariant = 'standalone' | 'mypage'

interface ProfileFormProps {
  variant?: ProfileFormVariant
}

function toSysCodeOptions(list: SysCodeItem[], emptyLabel = '선택하세요') {
  const sorted = [...list]
    .filter((c) => c.sysCodeUseFlag === 'Y')
    .sort((a, b) => a.sysCodeSort - b.sysCodeSort)
  return [
    { value: '', label: emptyLabel },
    ...sorted.map((c) => ({ value: c.sysCodeSid, label: c.sysCodeName })),
  ]
}

/** API 값이 SID 또는 명칭일 때 옵션 목록에서 선택용 value(SID)로 변환 */
function toOptionValue(
  apiValue: string | undefined,
  options: { value: string; label: string }[]
): string {
  if (!apiValue?.trim()) return ''
  const byValue = options.find((o) => o.value === apiValue.trim())
  if (byValue) return byValue.value
  const byLabel = options.find((o) => o.label === apiValue.trim())
  if (byLabel) return byLabel.value
  return apiValue.trim()
}

export default function ProfileForm({ variant = 'standalone' }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [joinedVia, setJoinedVia] = useState<string>('LOCAL')
  const [showPassword, setShowPassword] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [positionOptions, setPositionOptions] = useState<{ value: string; label: string }[]>([])
  const [regionDomesticOptions, setRegionDomesticOptions] = useState<{ value: string; label: string }[]>([])
  const [regionForeignOptions, setRegionForeignOptions] = useState<{ value: string; label: string }[]>([])
  const [fetchedUser, setFetchedUser] = useState<{
    position?: string
    region_type?: 'DOMESTIC' | 'FOREIGN'
    region_domestic?: string
    region_foreign?: string
  } | null>(null)
  const sysCodeLoadStartedRef = useRef(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const regionType = watch('region_type')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchUserInfo = async () => {
      try {
        const user = await getMe()
        setUserEmail(user.email)
        setJoinedVia(user.joined_via || 'LOCAL')
        setFetchedUser({
          position: user.position,
          region_type: user.region_type,
          region_domestic: user.region_domestic,
          region_foreign: user.region_foreign,
        })
        reset({
          password: '',
          phone: user.phone || '',
          name: user.name || '',
          nickname: user.nickname || '',
          position: user.position || '',
          birth_year: user.birth_year || new Date().getFullYear() - 30,
          birth_month: user.birth_month || 1,
          birth_day: user.birth_day || 1,
          region_type: user.region_type || 'DOMESTIC',
          region_domestic: user.region_domestic || '',
          region_foreign: user.region_foreign || '',
        })
      } catch {
        router.push('/login')
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserInfo()
  }, [router, reset])

  // 직분·지역 옵션: 캐시에 키가 있으면(빈 배열이어도) 캐시만 사용, 없을 때만 API 호출. 중복 호출 방지(Strict Mode 등).
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (sysCodeLoadStartedRef.current) return
      const cachedPos = getSysCodeFromCache(POSITION_PARENT)
      const cachedDom = getSysCodeFromCache(REGION_DOMESTIC_PARENT)
      const cachedFor = getSysCodeFromCache(REGION_FOREIGN_PARENT)
      if (cachedPos !== null && cachedDom !== null && cachedFor !== null) {
        setPositionOptions(toSysCodeOptions(cachedPos))
        setRegionDomesticOptions(toSysCodeOptions(cachedDom, '국내 지역을 선택하세요'))
        setRegionForeignOptions(toSysCodeOptions(cachedFor, '해외 지역을 선택하세요'))
        return
      }
      sysCodeLoadStartedRef.current = true
      try {
        const toLoad = []
        if (cachedPos === null) toLoad.push(loadSysCodeOnLogin(POSITION_PARENT))
        if (cachedDom === null) toLoad.push(loadSysCodeOnLogin(REGION_DOMESTIC_PARENT))
        if (cachedFor === null) toLoad.push(loadSysCodeOnLogin(REGION_FOREIGN_PARENT))
        if (toLoad.length) await Promise.all(toLoad)
        if (cancelled) return
        const positionList = getSysCodeFromCache(POSITION_PARENT) ?? []
        const domesticList = getSysCodeFromCache(REGION_DOMESTIC_PARENT) ?? []
        const foreignList = getSysCodeFromCache(REGION_FOREIGN_PARENT) ?? []
        setPositionOptions(toSysCodeOptions(positionList))
        setRegionDomesticOptions(toSysCodeOptions(domesticList, '국내 지역을 선택하세요'))
        setRegionForeignOptions(toSysCodeOptions(foreignList, '해외 지역을 선택하세요'))
      } finally {
        sysCodeLoadStartedRef.current = false
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // 직분·지역 옵션 로드 후 API에서 가져온 값으로 select 선택 상태 동기화 (SID/명칭 모두 대응)
  useEffect(() => {
    if (!fetchedUser) return
    const posValue = toOptionValue(fetchedUser.position, positionOptions)
    const domValue = toOptionValue(fetchedUser.region_domestic, regionDomesticOptions)
    const forValue = toOptionValue(fetchedUser.region_foreign, regionForeignOptions)
    if (posValue !== undefined) setValue('position', posValue)
    if (domValue !== undefined) setValue('region_domestic', domValue)
    if (forValue !== undefined) setValue('region_foreign', forValue)
  }, [fetchedUser, positionOptions, regionDomesticOptions, regionForeignOptions, setValue])

  // 국내/해외 전환 시 다른 지역 필드 초기화
  useEffect(() => {
    setValue(regionType === 'DOMESTIC' ? 'region_foreign' : 'region_domestic', '')
  }, [regionType, setValue])

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const profileData = {
        email: userEmail,
        phone: data.phone,
        name: data.name,
        nickname: data.nickname,
        position: data.position || undefined,
        birth_year: data.birth_year,
        birth_month: data.birth_month,
        birth_day: data.birth_day,
        region_type: data.region_type,
        ...(data.region_type === 'DOMESTIC'
          ? { region_domestic: data.region_domestic || '', region_foreign: '' }
          : { region_foreign: data.region_foreign || '', region_domestic: '' }),
        ...(data.password && data.password.trim() ? { password: data.password.trim() } : {}),
      }
      await updateProfile(profileData)
      alert('프로필이 성공적으로 수정되었습니다.')
      window.location.reload()
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'response' in err && err.response && typeof (err.response as any).data?.message === 'string'
          ? (err.response as any).data.message
          : err instanceof Error ? err.message : '프로필 수정에 실패했습니다.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  const joinedViaText = {
    LOCAL: '일반 가입',
    KAKAO: '카카오',
    NAVER: '네이버',
    GOOGLE: '구글',
  }[joinedVia] || '일반 가입'

  if (isLoadingUser) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-6 rounded-lg bg-white p-6 shadow"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={userEmail}
            disabled
            className="mt-1 bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
        </div>

        <div>
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 변경 시에만 입력해 주세요."
              {...register('password')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="joined_via">가입 방법</Label>
          <Input
            id="joined_via"
            type="text"
            value={joinedViaText}
            disabled
            className="mt-1 bg-gray-100"
          />
        </div>

        <div>
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            {...register('name')}
            className="mt-1"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            type="text"
            placeholder="닉네임을 입력하세요"
            {...register('nickname')}
            className="mt-1"
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">휴대폰</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              {...register('phone')}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]"
              onClick={() => alert('휴대폰 인증 요청 기능은 준비 중입니다.')}
            >
              인증요청
            </Button>
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="position">직분 (선택)</Label>
          <select
            id="position"
            {...register('position')}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">직분을 선택하세요</option>
            {positionOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.position && (
            <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
          )}
        </div>

        <div>
          <Label>생일</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <div>
              <Input
                type="number"
                placeholder="년"
                min={1900}
                max={new Date().getFullYear()}
                {...register('birth_year', { valueAsNumber: true })}
              />
              {errors.birth_year && (
                <p className="mt-1 text-xs text-red-600">{errors.birth_year.message}</p>
              )}
            </div>
            <div>
              <Input
                type="number"
                placeholder="월"
                min={1}
                max={12}
                {...register('birth_month', { valueAsNumber: true })}
              />
              {errors.birth_month && (
                <p className="mt-1 text-xs text-red-600">{errors.birth_month.message}</p>
              )}
            </div>
            <div>
              <Input
                type="number"
                placeholder="일"
                min={1}
                max={31}
                {...register('birth_day', { valueAsNumber: true })}
              />
              {errors.birth_day && (
                <p className="mt-1 text-xs text-red-600">{errors.birth_day.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label>지역</Label>
          <div className="mt-1 space-y-2">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="DOMESTIC"
                  {...register('region_type')}
                  className="mr-2"
                />
                <span className="text-sm">내국인</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="FOREIGN"
                  {...register('region_type')}
                  className="mr-2"
                />
                <span className="text-sm">외국인</span>
              </label>
            </div>
            {regionType === 'DOMESTIC' ? (
              <select
                {...register('region_domestic')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {regionDomesticOptions.map((opt) => (
                  <option key={opt.value || 'empty'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                {...register('region_foreign')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {regionForeignOptions.map((opt) => (
                  <option key={opt.value || 'empty'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {errors.region_domestic && (
              <p className="mt-1 text-sm text-red-600">{errors.region_domestic.message}</p>
            )}
            {errors.region_foreign && (
              <p className="mt-1 text-sm text-red-600">{errors.region_foreign.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          className={`flex-1 ${variant === 'mypage' ? 'bg-[#e1f800] text-[#111827] hover:bg-[#c9e000]' : ''}`}
          disabled={isLoading}
        >
          {isLoading
            ? '저장 중...'
            : variant === 'mypage'
              ? '회원 정보 수정'
              : '정보 수정'}
        </Button>
        {variant === 'standalone' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="flex-1"
          >
            로그아웃
          </Button>
        )}
      </div>

      {variant === 'mypage' && (
        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setWithdrawModalOpen(true)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            회원 탈퇴
          </button>
        </p>
      )}

      <WithdrawModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        joinedVia={joinedVia as 'LOCAL' | 'KAKAO' | 'NAVER' | 'GOOGLE'}
      />
    </form>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getMe, updateProfile, logout, isAuthenticated } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const profileSchema = z.object({
  phone: z.string().min(1, '핸드폰 번호를 입력해주세요.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
  position: z.string().min(1, '직분을 입력해주세요.'),
  birth_year: z.number().min(1900).max(new Date().getFullYear()),
  birth_month: z.number().min(1).max(12),
  birth_day: z.number().min(1).max(31),
  region_type: z.enum(['DOMESTIC', 'FOREIGN']),
  region_domestic: z.string().optional(),
  region_foreign: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

// 한국 도/광역시 목록
const koreanRegions = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
]

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [joinedVia, setJoinedVia] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const regionType = watch('region_type')

  useEffect(() => {
    // 인증 확인
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchUserInfo = async () => {
      try {
        const user = await getMe()
        setUserEmail(user.email)
        setJoinedVia(user.joined_via || 'LOCAL')

        // 폼에 기존 데이터 설정
        reset({
          phone: user.phone || '',
          name: user.name || '',
          position: user.position || '',
          birth_year: user.birth_year || new Date().getFullYear() - 30,
          birth_month: user.birth_month || 1,
          birth_day: user.birth_day || 1,
          region_type: user.region_type || 'DOMESTIC',
          region_domestic: user.region_domestic || '',
          region_foreign: user.region_foreign || '',
        })
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error)
        router.push('/login')
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserInfo()
  }, [router, reset])

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // region_type에 따라 region_domestic 또는 region_foreign 설정
      const profileData = {
        email: userEmail,
        phone: data.phone,
        name: data.name,
        position: data.position,
        birth_year: data.birth_year,
        birth_month: data.birth_month,
        birth_day: data.birth_day,
        region_type: data.region_type,
        ...(data.region_type === 'DOMESTIC'
          ? { region_domestic: data.region_domestic || '', region_foreign: '' }
          : { region_foreign: data.region_foreign || '', region_domestic: '' }),
      }

      await updateProfile(profileData)
      
      // 성공 메시지
      alert('프로필이 성공적으로 수정되었습니다.')
      
      // 페이지 새로고침하여 최신 정보 표시
      window.location.reload()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '프로필 수정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const joinedViaText = {
    LOCAL: '일반 가입',
    KAKAO: '카카오',
    NAVER: '네이버',
    GOOGLE: '구글',
  }[joinedVia] || '일반 가입'

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            내 정보
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            회원 정보를 조회하고 수정할 수 있습니다.
          </p>
        </div>
        
        <form className="bg-white rounded-lg shadow p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
              <Label htmlFor="phone">핸드폰</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                {...register('phone')}
                className="mt-1"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
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
              <Label htmlFor="position">직분 (교회 직분)</Label>
              <Input
                id="position"
                type="text"
                placeholder="예: 목사, 전도사, 장로 등"
                {...register('position')}
                className="mt-1"
              />
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
                    min="1900"
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
                    min="1"
                    max="12"
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
                    min="1"
                    max="31"
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
                    <option value="">도/광역시를 선택하세요</option>
                    {koreanRegions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    placeholder="국가/지역을 입력하세요"
                    {...register('region_foreign')}
                  />
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
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? '저장 중...' : '정보 수정'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="flex-1"
            >
              로그아웃
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}





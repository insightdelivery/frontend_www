'use client'

import { Suspense } from 'react'
import ProfileForm from '@/components/profile/ProfileForm'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            내 정보
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            회원 정보를 조회하고 수정할 수 있습니다.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-gray-600">로딩 중…</p>}>
          <ProfileForm variant="standalone" />
        </Suspense>
      </div>
    </div>
  )
}

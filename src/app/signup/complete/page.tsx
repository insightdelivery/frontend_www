'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'

/**
 * 회원가입 완료 안내 페이지 (useSearchParams 사용 → Suspense 내부)
 */
function SignupCompleteContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">
            회원가입이 완료되었습니다
          </h1>
          <p className="text-gray-600 leading-relaxed">
            가입하신 이메일 주소로 <strong>인증 메일</strong>을 보냈습니다.
          </p>
          {email && (
            <p className="text-gray-700 font-medium break-all">
              {email}
            </p>
          )}
          <p className="text-gray-600 leading-relaxed">
            메일 안의 <strong>인증 링크를 클릭</strong>하시면 이메일 인증이 완료됩니다.
            <br />
            인증을 완료한 후에만 로그인할 수 있습니다.
          </p>
          <p className="text-sm text-gray-500">
            메일이 보이지 않으면 스팸함을 확인해 주세요.
          </p>
        </div>
        <div className="mt-10 w-full">
          <Link
            href="/login"
            className="block w-full text-center py-3 px-4 rounded-md bg-black text-white font-medium hover:bg-gray-800"
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function SignupCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-600" />
          <p className="mt-4 text-gray-500 text-sm">로딩 중...</p>
        </div>
      }
    >
      <SignupCompleteContent />
    </Suspense>
  )
}

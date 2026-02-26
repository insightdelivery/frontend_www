'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail } from '@/services/auth'
import Footer from '@/components/layout/Footer'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('인증 링크가 올바르지 않습니다.')
      return
    }
    verifyEmail(token)
      .then((res) => {
        if (res.success) {
          setStatus('success')
          setMessage(res.message || '이메일 인증이 완료되었습니다.')
        } else {
          setStatus('error')
          setMessage(res.error || '인증에 실패했습니다.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('인증 처리 중 오류가 발생했습니다.')
      })
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">이메일 인증을 처리하고 있습니다...</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {status === 'success' ? '이메일 인증이 완료되었습니다' : '인증 실패'}
          </h1>
          <p className={status === 'success' ? 'text-gray-600' : 'text-red-600'}>
            {message}
          </p>
        </div>
        <div className="mt-10 w-full">
          <Link
            href="/login"
            className="block w-full text-center py-3 px-4 rounded-md bg-black text-white font-medium hover:bg-gray-800"
          >
            로그인하기
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

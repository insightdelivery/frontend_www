'use client'

/**
 * short 링크 resolve 후 아티클 상세로 이동 — contentShareLinkCopy.md §6
 * `/s?code=` (정적 export 표준). `/s/{code}` 는 middleware → 쿼리로 변환.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { visitShareShortCode } from '@/services/contentShare'

export default function ShortShareRedirectClient({ code }: { code: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('이동 중…')
  const trimmed = (code ?? '').trim()

  useEffect(() => {
    if (!trimmed) {
      router.replace('/article')
      return
    }
    let cancelled = false
    visitShareShortCode(trimmed)
      .then((res) => {
        if (cancelled) return
        if (res.contentType === 'ARTICLE') {
          const q = res.expired ? `?id=${res.contentId}&share_expired=1` : `?id=${res.contentId}`
          router.replace(`/article/detail${q}`)
          return
        }
        setMessage('지원하지 않는 링크입니다.')
        setTimeout(() => router.replace('/'), 2000)
      })
      .catch(() => {
        if (cancelled) return
        setMessage('링크를 찾을 수 없습니다.')
        setTimeout(() => router.replace('/article'), 2000)
      })
    return () => {
      cancelled = true
    }
  }, [trimmed, router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <p className="text-[16px] text-[#64748b]">{message}</p>
    </main>
  )
}

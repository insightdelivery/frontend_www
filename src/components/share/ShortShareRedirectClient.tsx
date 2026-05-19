'use client'

/**
 * short 링크 resolve 후 아티클 상세로 이동 — contentShareLinkCopy.md §6
 * `/s?code=` — 브라우저는 visit 후 상세로 이동. OG는 서버 `generateMetadata`가 처리.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { visitShareShortCode } from '@/services/contentShare'
import { articleDetailPath, seminarDetailPath, videoDetailPath } from '@/lib/contentDetailRoutes'

function appendQuery(path: string, params: URLSearchParams): string {
  const qs = params.toString()
  if (!qs) return path
  return `${path}${path.includes('?') ? '&' : '?'}${qs}`
}

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
        const ct = (res.contentType || '').toUpperCase()
        const id = res.contentId
        if (ct === 'ARTICLE') {
          const idStr = String(id)
          const params = new URLSearchParams({ from_share: '1' })
          if (res.expired) params.set('share_expired', '1')
          // router.replace만 쓰면 정적 export·클라이언트 라우팅에서 주소창에 from_share 등 쿼리가 남지 않는 경우가 있어 전체 이동으로 고정
          const url = `${window.location.origin}${appendQuery(articleDetailPath(idStr), params)}`
          window.location.replace(url)
          return
        }
        if (ct === 'VIDEO') {
          const params = new URLSearchParams()
          if (res.expired) params.set('share_expired', '1')
          router.replace(appendQuery(videoDetailPath(id), params))
          return
        }
        if (ct === 'SEMINAR') {
          const params = new URLSearchParams()
          if (res.expired) params.set('share_expired', '1')
          router.replace(appendQuery(seminarDetailPath(id), params))
          return
        }
        setMessage('지원하지 않는 링크입니다.')
        setTimeout(() => router.replace('/article'), 2000)
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

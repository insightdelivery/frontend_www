'use client'

import { useEffect, useState } from 'react'
import type { HomepageDocPayload } from '@/types/homepageDoc'
import type { HomepageDocType } from '@/constants/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { HomepageDocBody } from '@/components/homepage/HomepageDocBody'

export function HomepageDocClientView({
  docType,
  bottomAnchorId,
}: {
  docType: HomepageDocType
  bottomAnchorId?: string
}) {
  const [doc, setDoc] = useState<HomepageDocPayload | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setDoc(undefined)
    ;(async () => {
      try {
        const result = await fetchHomepageDocPublic(docType)
        if (cancelled) return
        setDoc(result ?? null)
        if (result?.title?.trim()) {
          document.title = `${result.title.trim()} | InDe`
        }
      } catch {
        if (cancelled) return
        setDoc(null)
        setError('문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [docType])

  /** 문서 렌더 후 #bottomAnchorId로 이동(클라이언트 전환 시 브라우저 기본 해시 스크롤이 안 될 수 있음) */
  useEffect(() => {
    if (doc === undefined || doc === null || !bottomAnchorId) return
    if (typeof window === 'undefined') return
    if (window.location.hash !== `#${bottomAnchorId}`) return
    const id = bottomAnchorId
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    requestAnimationFrame(() => requestAnimationFrame(scroll))
  }, [doc, bottomAnchorId])

  if (doc === undefined) {
    return (
      <main className="bg-white text-black min-h-screen">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
          <p className="text-gray-500">불러오는 중…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="bg-white text-black min-h-screen">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    )
  }

  if (!doc) {
    return (
      <main className="bg-white text-black min-h-screen">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
          <p className="text-gray-600">문서를 찾을 수 없습니다.</p>
        </div>
      </main>
    )
  }

  const title = doc.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES[docType]
  const html = sanitizeHomepageHtml(doc.bodyHtml || '')
  return <HomepageDocBody title={title} html={html} bottomAnchorId={bottomAnchorId} />
}

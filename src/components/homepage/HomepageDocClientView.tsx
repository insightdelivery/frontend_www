'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '@/lib/api'
import type { HomepageDocPayload } from '@/types/homepageDoc'
import type { HomepageDocType } from '@/constants/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import { unwrapHomepageDocApi } from '@/services/homepageDoc'
import { HomepageDocBody } from '@/components/homepage/HomepageDocBody'

async function fetchHomepageDoc(docType: HomepageDocType): Promise<HomepageDocPayload | null> {
  try {
    const { data } = await api.get<unknown>(`/api/homepage-docs/${docType}`)
    return unwrapHomepageDocApi(data)
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) return null
    throw e
  }
}

export function HomepageDocClientView({ docType }: { docType: HomepageDocType }) {
  const [doc, setDoc] = useState<HomepageDocPayload | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setDoc(undefined)
    ;(async () => {
      try {
        const result = await fetchHomepageDoc(docType)
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

  if (doc === undefined) {
    return (
      <main className="bg-white text-black min-h-screen">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
          <p className="text-gray-500">불러오는 중…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="bg-white text-black min-h-screen">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    )
  }

  if (!doc) {
    return (
      <main className="bg-white text-black min-h-screen">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
          <p className="text-gray-600">문서를 찾을 수 없습니다.</p>
        </div>
      </main>
    )
  }

  const title = doc.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES[docType]
  const html = sanitizeHomepageHtml(doc.bodyHtml || '')
  return <HomepageDocBody title={title} html={html} />
}

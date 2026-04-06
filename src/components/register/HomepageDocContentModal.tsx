'use client'

import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import type { HomepageDocType } from '@/constants/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import type { HomepageDocPayload } from '@/types/homepageDoc'

export type RegisterLegalDocType = Extract<HomepageDocType, 'terms_of_service' | 'privacy_policy'>

type HomepageDocContentModalProps = {
  open: boolean
  onClose: () => void
  docType: RegisterLegalDocType
}

/**
 * `/terms`, `/privacy` 와 동일 출처(`GET /api/homepage-docs/...`) — wwwDocEtc.md
 */
export function HomepageDocContentModal({ open, onClose, docType }: HomepageDocContentModalProps) {
  const titleId = useId()
  const [doc, setDoc] = useState<HomepageDocPayload | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setDoc(undefined)
      setError(null)
      return
    }
    let cancelled = false
    setDoc(undefined)
    setError(null)
    ;(async () => {
      try {
        const result = await fetchHomepageDocPublic(docType)
        if (cancelled) return
        setDoc(result ?? null)
      } catch {
        if (cancelled) return
        setDoc(null)
        setError('문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, docType])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const title = doc?.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES[docType]
  const html = doc ? sanitizeHomepageHtml(doc.bodyHtml || '') : ''

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <h2 id={titleId} className="truncate text-lg font-bold text-gray-900">
            {doc === undefined ? '불러오는 중…' : title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="모달 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : doc === undefined ? (
            <p className="text-sm text-gray-500">불러오는 중…</p>
          ) : !doc ? (
            <p className="text-sm text-gray-600">문서를 찾을 수 없습니다.</p>
          ) : html.trim() ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 sm:prose-base [&_a]:text-blue-700 [&_img]:h-auto [&_img]:max-w-full"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-sm text-gray-600">등록된 내용이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import type { HomepageDocPayload } from '@/types/homepageDoc'
import type { HomepageDocType } from '@/constants/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { HomepageDocBody } from '@/components/homepage/HomepageDocBody'

type FragmentNavigateEvent = Event & { hashChange?: boolean }

function subscribeLocationHash(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  /** Next 등이 `history.pushState`로 해시만 바꿀 때 `hashchange`가 안 뜨는 경우 보완 */
  const nav = (window as Window & { navigation?: EventTarget }).navigation
  const onNavigate = (e: Event) => {
    if ((e as FragmentNavigateEvent).hashChange) onChange()
  }
  nav?.addEventListener('navigate', onNavigate)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
    nav?.removeEventListener('navigate', onNavigate)
  }
}

function getLocationHashSnapshot() {
  return typeof window !== 'undefined' ? window.location.hash : ''
}

function scrollFragmentIntoView(behavior: ScrollBehavior) {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw) return
  try {
    document.getElementById(decodeURIComponent(raw))?.scrollIntoView({ behavior, block: 'start' })
  } catch {
    /* invalid fragment */
  }
}

function scheduleScrollToFragment(behavior: ScrollBehavior) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollFragmentIntoView(behavior))
  })
}

export function HomepageDocClientView({
  docType,
}: {
  docType: HomepageDocType
}) {
  const pathname = usePathname()
  const locationHash = useSyncExternalStore(subscribeLocationHash, getLocationHashSnapshot, () => '')
  const bodyRootRef = useRef<HTMLDivElement>(null)
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

  /** 문서·해시·경로 반영 후 URL 해시(#id)로 이동 + 본문 이미지 로드로 레이아웃이 밀릴 때 보정 */
  useEffect(() => {
    if (doc === undefined || doc === null) return
    if (typeof window === 'undefined') return

    scheduleScrollToFragment('smooth')

    const root = bodyRootRef.current
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const onImgLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        if (!window.location.hash.replace(/^#/, '')) return
        scheduleScrollToFragment('auto')
      }, 120)
    }

    const imgs = root ? Array.from(root.querySelectorAll('img')) : []
    for (const img of imgs) {
      if (!(img as HTMLImageElement).complete) {
        img.addEventListener('load', onImgLoad)
      }
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      for (const img of imgs) {
        img.removeEventListener('load', onImgLoad)
      }
    }
  }, [doc, locationHash, pathname])

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
  return <HomepageDocBody ref={bodyRootRef} title={title} html={html} />
}

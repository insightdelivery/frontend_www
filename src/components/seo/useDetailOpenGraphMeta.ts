'use client'

import { useEffect } from 'react'

const MARK = 'data-inde-detail-og'

export type DetailOgType = 'article' | 'website'

/**
 * 정적 export(`output: 'export'`) 환경용 — 콘텐츠 로드 후 `document`에 OG·Twitter·canonical 반영.
 * 크롤러가 JS를 실행하면 미리보기에 반영된다.
 */
export function useDetailOpenGraphMeta(params: {
  active: boolean
  title: string
  description: string
  imageUrl: string | null | undefined
  ogType?: DetailOgType
}) {
  const { active, title, description, imageUrl, ogType = 'website' } = params

  useEffect(() => {
    if (!active || typeof window === 'undefined') return
    const t = title.trim()
    if (!t) return

    const prevTitle = document.title
    const fullTitle = `${t} | InDe`
    document.title = fullTitle

    const metaDescEl = document.querySelector('meta[name="description"]')
    const prevDesc = metaDescEl?.getAttribute('content') ?? null
    const descRaw = description.trim()
    const desc = descRaw || `${t} — InDe`
    if (metaDescEl) metaDescEl.setAttribute('content', desc)

    const origin = window.location.origin.replace(/\/$/, '')
    const pageUrl = window.location.href
    const fallbackImg = `${origin}/indeOgLogo.jpeg?v=2`
    const img = (imageUrl && String(imageUrl).trim()) || fallbackImg

    const rows: Array<{ tag: 'meta' | 'link'; attrs: Record<string, string> }> = [
      { tag: 'meta', attrs: { property: 'og:title', content: t } },
      { tag: 'meta', attrs: { property: 'og:description', content: desc } },
      { tag: 'meta', attrs: { property: 'og:image', content: img } },
      { tag: 'meta', attrs: { property: 'og:url', content: pageUrl } },
      { tag: 'meta', attrs: { property: 'og:type', content: ogType } },
      { tag: 'meta', attrs: { property: 'og:site_name', content: 'InDe' } },
      { tag: 'meta', attrs: { property: 'og:locale', content: 'ko_KR' } },
      { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      { tag: 'meta', attrs: { name: 'twitter:title', content: t } },
      { tag: 'meta', attrs: { name: 'twitter:description', content: desc } },
      { tag: 'meta', attrs: { name: 'twitter:image', content: img } },
      { tag: 'link', attrs: { rel: 'canonical', href: pageUrl } },
    ]

    const created: Element[] = []
    for (const row of rows) {
      const el = document.createElement(row.tag)
      Object.entries(row.attrs).forEach(([k, v]) => el.setAttribute(k, v))
      el.setAttribute(MARK, '1')
      document.head.appendChild(el)
      created.push(el)
    }

    return () => {
      document.title = prevTitle
      if (metaDescEl && prevDesc !== null) metaDescEl.setAttribute('content', prevDesc)
      created.forEach((e) => e.remove())
    }
  }, [active, title, description, imageUrl, ogType])
}

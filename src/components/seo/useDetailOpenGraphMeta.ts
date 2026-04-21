'use client'

import { useEffect } from 'react'

const MARK = 'data-inde-detail-og'

export type DetailOgType = 'article' | 'website'

type ManagedEntry =
  | { kind: 'created'; el: Element }
  | { kind: 'updated'; el: Element; prev: Record<string, string | null> }

function readAttrs(el: Element, keys: string[]): Record<string, string | null> {
  const out: Record<string, string | null> = {}
  for (const k of keys) {
    out[k] = el.getAttribute(k)
  }
  return out
}

function applyAttrs(el: Element, attrs: Record<string, string>) {
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
}

/**
 * `meta[property]` / `meta[name]` / `link[rel]` 로 기존 노드를 찾아 **content·href를 갱신**한다.
 * Next 루트 `metadata`가 넣은 기본 OG·Twitter가 `<head>` 앞쪽에 있어도, 동일 키는 덮어써서
 * 크롤러가 읽는 값이 콘텐츠 기준으로 바뀐다.
 */
function upsertHeadElement(
  bucket: ManagedEntry[],
  find: () => Element | null,
  tag: 'meta' | 'link',
  attrs: Record<string, string>,
  attrKeysToSave: string[],
) {
  const existing = find()
  if (existing) {
    const prev = readAttrs(existing, attrKeysToSave)
    applyAttrs(existing, attrs)
    existing.setAttribute(MARK, '1')
    bucket.push({ kind: 'updated', el: existing, prev })
    return
  }
  const el = document.createElement(tag)
  applyAttrs(el, attrs)
  el.setAttribute(MARK, '1')
  document.head.appendChild(el)
  bucket.push({ kind: 'created', el })
}

/**
 * 정적 export(`output: 'export'`) — 콘텐츠 로드 후 기본 OG·Twitter 메타를 **갱신**.
 * (JS 미실행 크롤러는 여전히 빌드 시 기본 HTML만 본다.)
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

    const managed: ManagedEntry[] = []

    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[property="og:title"]'),
      'meta',
      { property: 'og:title', content: t },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[property="og:description"]'),
      'meta',
      { property: 'og:description', content: desc },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[property="og:image"]'),
      'meta',
      { property: 'og:image', content: img },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[property="og:url"]'),
      'meta',
      { property: 'og:url', content: pageUrl },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[property="og:type"]'),
      'meta',
      { property: 'og:type', content: ogType },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[property="og:site_name"]'),
      'meta',
      { property: 'og:site_name', content: 'InDe' },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[property="og:locale"]'),
      'meta',
      { property: 'og:locale', content: 'ko_KR' },
      ['content'],
    )

    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[name="twitter:card"]'),
      'meta',
      { name: 'twitter:card', content: 'summary_large_image' },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[name="twitter:title"]'),
      'meta',
      { name: 'twitter:title', content: t },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[name="twitter:description"]'),
      'meta',
      { name: 'twitter:description', content: desc },
      ['content'],
    )
    upsertHeadElement(
      managed,
      () => document.head.querySelector('meta[name="twitter:image"]'),
      'meta',
      { name: 'twitter:image', content: img },
      ['content'],
    )

    upsertHeadElement(
      managed,
      () => document.head.querySelector('link[rel="canonical"]'),
      'link',
      { rel: 'canonical', href: pageUrl },
      ['href'],
    )

    const imageAltSel = document.head.querySelector('meta[property="og:image:alt"]')
    if (imageAltSel) {
      const prevAlt = readAttrs(imageAltSel, ['content'])
      imageAltSel.setAttribute('content', t)
      imageAltSel.setAttribute(MARK, '1')
      managed.push({ kind: 'updated', el: imageAltSel, prev: prevAlt })
    }

    return () => {
      document.title = prevTitle
      if (metaDescEl && prevDesc !== null) metaDescEl.setAttribute('content', prevDesc)
      for (const m of managed) {
        if (m.kind === 'created') {
          m.el.remove()
        } else {
          for (const [k, v] of Object.entries(m.prev)) {
            if (v === null) m.el.removeAttribute(k)
            else m.el.setAttribute(k, v)
          }
          m.el.removeAttribute(MARK)
        }
      }
    }
  }, [active, title, description, imageUrl, ogType])
}

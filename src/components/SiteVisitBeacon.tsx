'use client'

import Cookies from 'js-cookie'
import { useEffect, useRef } from 'react'
import { postSiteVisit } from '@/services/siteVisit'

const VID_COOKIE = 'inde_visit_vid'
/** js-cookie는 `expires`만 일 단위로 지원(maxAge 미지원) — 약 1년 */
const COOKIE_EXPIRES_DAYS = 365

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function randomUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getOrCreateVisitorId(): string {
  const existing = Cookies.get(VID_COOKIE)?.trim()
  if (existing && UUID_RE.test(existing)) return existing
  const id = randomUuidV4()
  Cookies.set(VID_COOKIE, id, { path: '/', expires: COOKIE_EXPIRES_DAYS, sameSite: 'lax' })
  return id
}

/**
 * www 루트에서 클라이언트 마운트 1회만 방문 이벤트 전송 (SPA 내부 라우트 전환은 미포함, MVP).
 */
export default function SiteVisitBeacon() {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    const path = `${window.location.pathname}${window.location.search}`.slice(0, 400)
    const visitorKey = getOrCreateVisitorId()
    postSiteVisit({ visitorKey, path }).catch(() => {})
  }, [])

  return null
}

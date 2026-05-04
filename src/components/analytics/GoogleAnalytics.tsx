'use client'

/**
 * GA4 — `_docsRules/googleAnalyticsPlan.md`
 * - gtag/config: send_page_view: false
 * - page_view: gtag('event', 'page_view', …) 만
 * - App Router: usePathname + useSearchParams (next/navigation)
 */

import Script from 'next/script'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { gaSendPageView, getGaMeasurementId, isGaConfigured } from '@/lib/analytics/gtag'

function GoogleAnalyticsPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const qs = searchParams.toString()

  useEffect(() => {
    gaSendPageView()
  }, [pathname, qs])

  return null
}

export default function GoogleAnalytics() {
  const gaId = getGaMeasurementId()
  const [gtagReady, setGtagReady] = useState(false)

  const onGtagJsLoad = useCallback(() => {
    if (!isGaConfigured()) return
    const id = getGaMeasurementId()
    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
    window.gtag = gtag
    gtag('js', new Date())
    const debugMode = process.env.NODE_ENV !== 'production'
    gtag('config', id, {
      send_page_view: false,
      ...(debugMode ? { debug_mode: true } : {}),
    })
    setGtagReady(true)
  }, [])

  if (!isGaConfigured()) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="afterInteractive"
        onLoad={onGtagJsLoad}
      />
      {gtagReady ? (
        <Suspense fallback={null}>
          <GoogleAnalyticsPageViewTracker />
        </Suspense>
      ) : null}
    </>
  )
}

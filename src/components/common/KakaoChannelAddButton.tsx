'use client'

/**
 * 카카오톡 채널 추가(플로팅) — `kakaoChannelButtonPlan.md`
 * **공식 위젯** `Kakao.Channel.createAddChannelButton` · `size: 'large'`(가로형 Ch+ 버튼).
 * 클릭 시 웹/앱/카카오톡 PC 연동은 **카카오 SDK가 처리**한다(도메인·채널·앱 연동·OS 환경에 따름).
 * env: NEXT_PUBLIC_KAKAO_JS_KEY, NEXT_PUBLIC_KAKAO_CHANNEL_PUBLIC_ID (예: _xxxx)
 */

import { useEffect, useRef } from 'react'
import { SITE_SHELL_MAX_CLASS } from '@/lib/siteLayoutWidth'
import { loadKakaoJsSdk } from '@/lib/kakaoSdk'

function getKakaoJsKey(): string {
  return (process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '').trim()
}

function getChannelPublicId(): string {
  return (process.env.NEXT_PUBLIC_KAKAO_CHANNEL_PUBLIC_ID || '').trim()
}

export function isKakaoChannelButtonConfigured(): boolean {
  const k = getKakaoJsKey()
  const c = getChannelPublicId()
  return k.length > 0 && c.length > 0
}

export default function KakaoChannelAddButton() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isKakaoChannelButtonConfigured()) return
    const el = containerRef.current
    if (!el) return

    let cancelled = false
    ;(async () => {
      try {
        await loadKakaoJsSdk()
        if (cancelled || !containerRef.current) return
        const Kakao = window.Kakao
        if (!Kakao?.Channel?.createAddChannelButton) return

        const jsKey = getKakaoJsKey()
        const channelId = getChannelPublicId()
        if (!jsKey || !channelId) return

        try {
          if (!(typeof Kakao.isInitialized === 'function' && Kakao.isInitialized())) {
            Kakao.init(jsKey)
          }
        } catch {
          /* 이미 init된 세션(Strict 이중 마운트 등) */
        }

        el.innerHTML = ''
        Kakao.Channel.createAddChannelButton({
          container: el,
          channelPublicId: channelId,
          size: 'large',
          supportMultipleDensities: true,
        })
      } catch {
        if (containerRef.current) containerRef.current.innerHTML = ''
      }
    })()

    return () => {
      cancelled = true
      el.innerHTML = ''
    }
  }, [])

  if (!isKakaoChannelButtonConfigured()) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-36 z-[400] flex justify-center px-4 sm:px-6 md:px-8">
      <div className={`pointer-events-none relative w-full ${SITE_SHELL_MAX_CLASS}`}>
        <div className="pointer-events-auto absolute right-0 top-0 rounded-[10px] shadow-md ring-1 ring-black/10">
          <div
            ref={containerRef}
            className="leading-none [&_a]:inline-block [&_a]:leading-none [&_img]:block [&_img]:max-w-none [&_img]:h-auto"
            aria-live="polite"
          />
        </div>
      </div>
    </div>
  )
}

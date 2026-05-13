'use client'

/**
 * 카카오톡 채널 추가(플로팅) — `kakaoChannelButtonPlan.md`
 * 직접 만든 컴팩트 버튼으로 `Kakao.Channel.addChannel` 호출.
 * 클릭 시 웹/앱/카카오톡 PC 연동은 **카카오 SDK가 처리**한다(도메인·채널·앱 연동·OS 환경에 따름).
 * env: NEXT_PUBLIC_KAKAO_JS_KEY, NEXT_PUBLIC_KAKAO_CHANNEL_PUBLIC_ID (예: _xxxx)
 */

import { useCallback, useEffect, useState } from 'react'
import { SITE_SHELL_MAX_CLASS } from '@/lib/siteLayoutWidth'
import { loadKakaoJsSdk } from '@/lib/kakaoSdk'

function getKakaoJsKey(): string {
  return (process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '').trim()
}

function getChannelPublicId(): string {
  return (process.env.NEXT_PUBLIC_KAKAO_CHANNEL_PUBLIC_ID || '').trim()
}

function logKakaoChannelButtonError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== 'development') return
  // eslint-disable-next-line no-console
  console.error(`[KakaoChannelAddButton] ${message}`, error ?? '')
}

export function isKakaoChannelButtonConfigured(): boolean {
  const k = getKakaoJsKey()
  const c = getChannelPublicId()
  return k.length > 0 && c.length > 0
}

export default function KakaoChannelAddButton() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!isKakaoChannelButtonConfigured()) return
      try {
        await loadKakaoJsSdk()
        if (cancelled) return
        const Kakao = window.Kakao
        if (!Kakao) {
          logKakaoChannelButtonError('Kakao SDK global is not available')
          return
        }

        const jsKey = getKakaoJsKey()
        const channelId = getChannelPublicId()
        if (!jsKey || !channelId) {
          logKakaoChannelButtonError('NEXT_PUBLIC_KAKAO_JS_KEY or NEXT_PUBLIC_KAKAO_CHANNEL_PUBLIC_ID is empty')
          return
        }

        try {
          if (!(typeof Kakao.isInitialized === 'function' && Kakao.isInitialized())) {
            Kakao.init(jsKey)
          }
        } catch (error) {
          /* 이미 init된 세션(Strict 이중 마운트 등) */
          logKakaoChannelButtonError('Kakao.init failed', error)
        }

        if (!Kakao.Channel?.addChannel) {
          logKakaoChannelButtonError('Kakao.Channel.addChannel is not available after Kakao.init')
          return
        }

        setReady(true)
      } catch (error) {
        logKakaoChannelButtonError('Failed to prepare Kakao channel add button', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleClick = useCallback(() => {
    const channelId = getChannelPublicId()
    if (!channelId) return

    const Kakao = window.Kakao
    if (!Kakao?.Channel?.addChannel) {
      logKakaoChannelButtonError('Kakao.Channel.addChannel is not available on click')
      return
    }

    Kakao.Channel.addChannel({ channelPublicId: channelId })
  }, [])

  if (!isKakaoChannelButtonConfigured()) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-36 z-[400] flex justify-center px-4 sm:px-6 md:px-8">
      <div className={`pointer-events-none relative w-full ${SITE_SHELL_MAX_CLASS}`}>
        <button
          type="button"
          onClick={handleClick}
          disabled={!ready}
          title="카카오톡 채널 추가"
          aria-label="카카오톡 채널 추가"
          className="pointer-events-auto absolute right-0 top-0 inline-flex h-9 items-center gap-0.5 rounded-full bg-[#FEE500] px-3 text-[14px] font-black leading-none text-black shadow-md ring-1 ring-black/10 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-[9px] font-black text-[#FEE500]">
            Ch
          </span>
          <span aria-hidden className="text-[16px] font-black">
            +
          </span>
        </button>
      </div>
    </div>
  )
}

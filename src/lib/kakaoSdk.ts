/**
 * 카카오 JavaScript SDK 동적 로드 — `kakaoChannelButtonPlan.md`
 * 공식: https://developers.kakao.com/docs/latest/ko/javascript/download
 *
 * DOM에 `<script>`만 있고 `load` 이벤트가 이미 지난 경우(재방문·HMR 등)에도
 * `window.Kakao`가 잡히도록 짧은 폴링(`waitForKakaoGlobal`)으로 보완한다.
 */

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js'

let _kakaoSdkPromise: Promise<void> | null = null

function waitForKakaoGlobal(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      if (window.Kakao) {
        resolve()
        return
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error('Kakao SDK timeout'))
        return
      }
      window.setTimeout(tick, 30)
    }
    tick()
  })
}

export function loadKakaoJsSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Kakao) return Promise.resolve()
  if (_kakaoSdkPromise) return _kakaoSdkPromise

  _kakaoSdkPromise = new Promise((resolve, reject) => {
    const settleOk = () => {
      if (window.Kakao) {
        resolve()
        return true
      }
      return false
    }

    const existing = document.querySelector(`script[src="${KAKAO_SDK_URL}"]`)
    if (existing) {
      if (settleOk()) return
      existing.addEventListener('error', () => reject(new Error('Kakao SDK load error')), { once: true })
      void waitForKakaoGlobal(12_000).then(resolve).catch(reject)
      return
    }

    const s = document.createElement('script')
    s.src = KAKAO_SDK_URL
    s.async = true
    s.crossOrigin = 'anonymous'
    s.onerror = () => reject(new Error('Kakao SDK load error'))
    s.onload = () => {
      if (!settleOk()) void waitForKakaoGlobal(12_000).then(resolve).catch(reject)
    }
    document.head.appendChild(s)
  })

  return _kakaoSdkPromise
}

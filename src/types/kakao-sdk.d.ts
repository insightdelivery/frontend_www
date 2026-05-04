/** 카카오 JavaScript SDK — 채널 버튼용 최소 타입 */
export {}

declare global {
  interface Window {
    Kakao?: {
      init: (javascriptKey: string) => void
      isInitialized?: () => boolean
      Channel: {
        addChannel: (settings: { channelPublicId: string }) => unknown
        followChannel?: (settings: { channelPublicId: string }) => Promise<unknown>
        createAddChannelButton: (settings: {
          container: HTMLElement | string
          channelPublicId: string
          size?: 'small' | 'large'
          supportMultipleDensities?: boolean
        }) => void
      }
    }
  }
}

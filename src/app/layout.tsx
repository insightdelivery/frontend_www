import type { Metadata } from 'next'
import './globals.css'
import SiteVisitBeacon from '@/components/SiteVisitBeacon'
import SysCodeLoader from '@/components/SysCodeLoader'
import { AuthProvider } from '@/contexts/AuthContext'

const rawOrigin = (
  process.env.NEXT_PUBLIC_SITE_ORIGIN ||
  process.env.NEXT_PUBLIC_WWW_ORIGIN ||
  'https://www.inde.kr'
).trim()
const siteOrigin = (rawOrigin.replace(/\/$/, '') || 'https://www.inde.kr')

/** `<title>`·`meta description` (검색 등). 하위 페이지는 `template` 또는 개별 metadata로 덮어씀 */
const defaultTitle = 'InDe - 크리스천 인사이트 플랫폼'
const defaultDescription =
  'InDe는 말씀과 삶을 연결하는 크리스천 인사이트 플랫폼입니다. 아티클, 비디오 등을 통해 복음으로 세상을 조명하고, 일상에 적용하는 다양한 콘텐츠를 제공합니다.'

/** OG·Twitter 미리보기용 (검색용 메타와 별도) */
const ogTitle = 'InDe'
const ogDescription = '복음은 실전이다, 크리스천 인사이트 루틴'

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: defaultTitle,
    template: '%s | InDe',
  },
  description: defaultDescription,
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    siteName: 'InDe',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: '/indeOgLogo.jpeg?v=2',
        alt: 'InDe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: ogTitle,
    description: ogDescription,
    images: ['/indeOgLogo.jpeg?v=2'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: ['/favicon.png'],
    apple: [{ url: '/favicon-180x180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="msapplication-TileImage" content="/favicon-192x192.png" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SysCodeLoader />
          <SiteVisitBeacon />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

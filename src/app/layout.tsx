import type { Metadata } from 'next'
import './globals.css'
import SysCodeLoader from '@/components/SysCodeLoader'
import { AuthProvider } from '@/contexts/AuthContext'

const rawOrigin = (
  process.env.NEXT_PUBLIC_SITE_ORIGIN ||
  process.env.NEXT_PUBLIC_WWW_ORIGIN ||
  'https://www.inde.kr'
).trim()
const siteOrigin = (rawOrigin.replace(/\/$/, '') || 'https://www.inde.kr')

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: 'InDe',
    template: '%s | InDe',
  },
  description: '복음은 실전이다, 크리스천 인사이트 루틴',
  openGraph: {
    title: 'InDe',
    description: '복음은 실전이다, 크리스천 인사이트 루틴',
    siteName: 'InDe',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: '/indeOgLogo.jpeg',
        alt: 'InDe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InDe',
    description: '복음은 실전이다, 크리스천 인사이트 루틴',
    images: ['/indeOgLogo.jpeg'],
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
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

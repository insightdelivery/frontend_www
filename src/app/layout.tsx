import type { Metadata } from 'next'
import './globals.css'
import SysCodeLoader from '@/components/SysCodeLoader'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'InDe',
  description: 'InDe 웹사이트',
  icons: {
    icon: [
      { url: '/ms-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/ms-icon-150x150.png', sizes: '150x150', type: 'image/png' },
      { url: '/ms-icon-310x310.png', sizes: '310x310', type: 'image/png' },
    ],
    apple: [
      { url: '/ms-icon-150x150.png', sizes: '150x150', type: 'image/png' },
      { url: '/ms-icon-310x310.png', sizes: '310x310', type: 'image/png' },
    ],
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
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
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

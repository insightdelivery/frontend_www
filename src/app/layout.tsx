import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/layout/Header"
import SysCodeLoader from "@/components/SysCodeLoader"

export const metadata: Metadata = {
  title: "InDe",
  description: "InDe 웹사이트",
  icons: {
    icon: "/inde_logo.png",
    apple: "/inde_logo.png",
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
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <SysCodeLoader />
        <Header />
        {children}
      </body>
    </html>
  )
}



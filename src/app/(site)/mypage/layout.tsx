import { Suspense } from 'react'
import MypageShell from './components/MypageShell'

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-[14px] text-[#6b7280]">
          로딩 중…
        </div>
      }
    >
      <MypageShell>{children}</MypageShell>
    </Suspense>
  )
}

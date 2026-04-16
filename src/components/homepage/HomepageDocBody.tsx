import { forwardRef } from 'react'

/** 홈페이지 문서 본문 레이아웃(데이터는 각 라우트 전용 파일에서 로드) */
export const HomepageDocBody = forwardRef<
  HTMLDivElement,
  {
    title: string
    html: string
  }
>(function HomepageDocBody({ title, html }, ref) {
  return (
    <main className="bg-white text-black min-h-screen">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h1>
        <div
          ref={ref}
          className="mt-8 sm:mt-10 prose prose-gray max-w-none text-gray-700 [&_a]:text-blue-700 [&_img]:max-w-full [&_img]:h-auto [&_[id]]:scroll-mt-24"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  )
})

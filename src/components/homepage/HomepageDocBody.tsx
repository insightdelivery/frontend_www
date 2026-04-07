/** 홈페이지 문서 본문 레이아웃(데이터는 각 라우트 전용 파일에서 로드) */
export function HomepageDocBody({
  title,
  html,
  bottomAnchorId,
}: {
  title: string
  html: string
  /** 푸터 등에서 `#id`로 스크롤 이동할 페이지 하단 앵커 */
  bottomAnchorId?: string
}) {
  return (
    <main className="bg-white text-black min-h-screen">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h1>
        <div
          className="mt-8 sm:mt-10 prose prose-gray max-w-none text-gray-700 [&_a]:text-blue-700 [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {bottomAnchorId ? (
          <div id={bottomAnchorId} className="scroll-mt-20" tabIndex={-1} aria-hidden />
        ) : null}
      </div>
    </main>
  )
}

import { readFileSync } from 'fs'
import path from 'path'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: '이용약관 | InDe',
  description: 'InDe 서비스 이용약관',
}

function getTermsContent(): string {
  const filePath = path.join(process.cwd(), 'content', 'terms-of-use.txt')
  return readFileSync(filePath, 'utf-8')
}

export default function TermsPage() {
  const content = getTermsContent()
  const paragraphs = content.split(/\n\n+/).filter(Boolean)

  return (
    <main className="bg-white text-black min-h-screen">
      <div className="mx-auto max-w-[720px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">이용약관</h1>
        <p className="mt-2 text-[13px] text-gray-500">시행일: 2024년 1월 1일</p>

        <div className="mt-8 sm:mt-10 prose prose-gray max-w-none">
          {paragraphs.map((block, i) => {
            const lines = block.split('\n').filter(Boolean)
            const firstLine = lines[0] ?? ''
            const isArticleTitle = /^제\d+조/.test(firstLine.trim())

            return (
              <div key={i} className="mb-6">
                {isArticleTitle ? (
                  <h2 className="text-[15px] sm:text-[16px] font-bold text-gray-900 mt-6 first:mt-0">
                    {firstLine}
                  </h2>
                ) : (
                  <p className="text-[14px] sm:text-[15px] leading-[1.7] text-gray-700 mt-1">
                    {firstLine}
                  </p>
                )}
                {lines.slice(1).map((line, j) => (
                  <p
                    key={j}
                    className="text-[14px] sm:text-[15px] leading-[1.7] text-gray-700 mt-1 pl-0 sm:pl-4"
                  >
                    {line.trim()}
                  </p>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      <Footer />
    </main>
  )
}

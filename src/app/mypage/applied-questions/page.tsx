import Link from 'next/link'

const MOCK_ITEMS = [
  { id: '1', category: 'Design', title: '질문 1: 이 개념을 실무에 어떻게 적용할까요?', date: '2023.10.24', href: '#' },
  { id: '2', category: 'System', title: '질문 2: 시스템 디자인의 핵심 요소는?', date: '2023.10.22', href: '#' },
  { id: '3', category: 'Collaboration', title: '질문 3: 협업 툴 활용 팁이 있을까요?', date: '2023.10.18', href: '#' },
  { id: '4', category: 'Design', title: '질문 4: 컬러 시스템 구축 방법', date: '2023.10.15', href: '#' },
  { id: '5', category: 'System', title: '질문 5: 컴포넌트 라이브러리 관리', date: '2023.10.12', href: '#' },
  { id: '6', category: 'Design', title: '질문 6: 프로토타이핑 효율 높이기', date: '2023.10.10', href: '#' },
]

export default function MypageAppliedQuestionsPage() {
  const currentPage = 1

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_ITEMS.map((item) => (
          <article
            key={item.id}
            className="flex flex-col overflow-hidden rounded-xl border border-[#f1f5f9] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
          >
            <div className="flex flex-col gap-4">
              <span className="w-fit rounded-[2px] bg-[#f1f5f9] px-2 py-1 text-[10px] font-black uppercase tracking-[0.5px] text-[#475569]">
                {item.category}
              </span>
              <div className="h-[195px] w-full rounded-lg bg-[#f1f5f9]" aria-hidden />
              <h3 className="text-[18px] font-bold leading-[24.75px] text-[#0f172a]">{item.title}</h3>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[12px] leading-4 text-[#94a3b8]">{item.date}</span>
                <Link
                  href={item.href}
                  className="rounded bg-[#e1f800] px-2 py-1 text-[12px] font-bold text-black"
                >
                  적용질문 보기
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-20 flex justify-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0]"
          aria-label="이전"
        >
          <span className="text-[#475569]">‹</span>
        </button>
        {[1, 2, 3, 4, 5].map((p) => (
          <button
            key={p}
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-[16px] ${
              p === currentPage
                ? 'bg-[#e1f800] font-bold text-black'
                : 'border border-transparent font-medium text-[#475569]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0]"
          aria-label="다음"
        >
          <span className="text-[#475569]">›</span>
        </button>
      </div>
    </div>
  )
}

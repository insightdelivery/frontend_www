'use client'

interface WwwPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
  className?: string
  /** simple: 이전/숫자/다음만 (공지사항 등). full: 맨처음·맨뒤 포함 */
  variant?: 'full' | 'simple'
}

export default function WwwPagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 10,
  className = '',
  variant = 'full',
}: WwwPaginationProps) {
  if (totalPages <= 1) return null

  const safeCurrent = Math.min(Math.max(1, currentPage), totalPages)
  const safeMax = Math.min(maxVisiblePages, totalPages)
  const windowStart = Math.min(Math.max(1, safeCurrent - 4), totalPages - safeMax + 1)
  const windowEnd = windowStart + safeMax - 1
  const pageNumbers = Array.from(
    { length: Math.max(0, windowEnd - windowStart + 1) },
    (_, i) => windowStart + i
  )

  const goTo = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages)
    if (next === safeCurrent) return
    onPageChange(next)
  }

  const simplePrevNext =
    'flex h-9 min-w-[2rem] items-center justify-center text-[15px] font-medium text-[#0f172a] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80'

  if (variant === 'simple') {
    return (
      <nav className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`.trim()} aria-label="페이지네이션">
        <button type="button" onClick={() => goTo(safeCurrent - 1)} disabled={safeCurrent <= 1} className={simplePrevNext} aria-label="이전 페이지">
          &lt;
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => goTo(page)}
            className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-md text-[15px] transition-colors ${
              page === safeCurrent
                ? 'bg-[#e1f800] font-bold text-[#0f172a]'
                : 'font-medium text-[#0f172a] hover:bg-gray-100'
            }`}
            aria-label={`${page}페이지`}
            aria-current={page === safeCurrent ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => goTo(safeCurrent + 1)}
          disabled={safeCurrent >= totalPages}
          className={simplePrevNext}
          aria-label="다음 페이지"
        >
          &gt;
        </button>
      </nav>
    )
  }

  return (
    <nav className={`mt-10 flex items-center justify-center gap-2 ${className}`.trim()} aria-label="페이지네이션">
      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={safeCurrent <= 1}
        className="flex h-10 items-center justify-center rounded-lg border border-[#e2e8f0] px-3 text-[13px] font-medium text-[#475569] disabled:opacity-50"
        aria-label="맨 처음 페이지"
      >
        맨처음
      </button>

      <button
        type="button"
        onClick={() => goTo(safeCurrent - 1)}
        disabled={safeCurrent <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-50"
        aria-label="이전 페이지"
      >
        <span className="text-[#475569]">‹</span>
      </button>

      {pageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goTo(page)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-[16px] transition-colors ${
            page === safeCurrent
              ? 'bg-[#e1f800] font-bold text-[#0f172a]'
              : 'border border-transparent font-medium text-[#475569] hover:bg-gray-100'
          }`}
          aria-label={`${page}페이지`}
          aria-current={page === safeCurrent ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goTo(safeCurrent + 1)}
        disabled={safeCurrent >= totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] disabled:opacity-50"
        aria-label="다음 페이지"
      >
        <span className="text-[#475569]">›</span>
      </button>

      <button
        type="button"
        onClick={() => goTo(totalPages)}
        disabled={safeCurrent >= totalPages}
        className="flex h-10 items-center justify-center rounded-lg border border-[#e2e8f0] px-3 text-[13px] font-medium text-[#475569] disabled:opacity-50"
        aria-label="맨 마지막 페이지"
      >
        맨뒤로
      </button>
    </nav>
  )
}


import Link from 'next/link'
import type { NoticeListItem } from '@/types/board'

const noticeHref = (id: number) => `/notice?id=${id}`

export type MainBarProps = {
  /** Header에서 1회 fetch한 GNB 공지 1건 — 없으면 32px 슬롯만 유지 */
  notice: NoticeListItem | null
  /** GNB inner — 항상 `max-w-[900px]` (`siteShellMaxWidthClass`) */
  shellMaxClass?: string
}

/**
 * GNB 상단 바 — wwwLayoutPlan.md
 * 항상 높이 32px 유지 (공지 없어도 레이아웃 시프트 없음)
 */
export default function MainBar({ notice, shellMaxClass = 'max-w-[900px]' }: MainBarProps) {
  const href = notice ? noticeHref(notice.id) : undefined

  return (
    <div className="bg-[#8D93FF]">
      <div
        className={`mx-auto flex h-8 min-h-[2rem] ${shellMaxClass} items-center justify-between gap-4 px-4 font-sans text-[13px] font-normal text-[#4D4D4D] sm:text-[14px] md:px-8`}
      >
        {notice && href ? (
          <>
            <Link
              href={href}
              className="min-w-0 flex-1 truncate text-left no-underline hover:no-underline hover:opacity-90"
              aria-live="polite"
            >
              {notice.title}
            </Link>
            <Link
              href={href}
              className="shrink-0 tracking-tight no-underline hover:no-underline hover:opacity-90"
              aria-label={`공지 상세: ${notice.title}`}
            >
              &gt;&gt;&gt;
            </Link>
          </>
        ) : (
          <span className="sr-only">GNB 공지 없음</span>
        )}
      </div>
    </div>
  )
}

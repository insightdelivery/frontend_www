'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { fetchNotices } from '@/services/board'
import type { NoticeListItem } from '@/types/board'

const noticeHref = (id: number) => `/notice?id=${id}`

/**
 * GNB(Header) 바로 위 프로모션 바 — wwwLayoutPlan.md §2
 * 관리자에서 "GNB 상단에 표시"가 켜진 공지 1건의 제목을 표시하고, >>> 는 해당 공지 상세로 이동합니다.
 * 표시할 공지가 없으면 바 전체를 렌더하지 않습니다.
 */
export default function MainBar() {
  const pathname = usePathname()
  const [items, setItems] = useState<NoticeListItem[]>([])

  useEffect(() => {
    if (pathname?.startsWith('/auth/callback')) {
      setItems([])
      return
    }
    let cancelled = false
    fetchNotices({ page: 1, page_size: 20, show_in_gnb: true })
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray(res.results) ? res.results : []
        setItems(list.filter((row) => row.show_in_gnb === true))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  const notice = items[0]
  if (!notice) return null

  const href = noticeHref(notice.id)

  return (
    <div className="bg-[#8D93FF]">
      <div className="mx-auto flex h-[2rem] max-w-[1220px] items-center justify-between gap-4 px-4 font-sans text-[13px] font-normal text-[#4D4D4D] sm:text-[14px] md:px-8">
        <Link
          href={href}
          className="min-w-0 flex-1 truncate text-left hover:opacity-90 hover:underline"
          aria-live="polite"
        >
          {notice.title}
        </Link>
        <Link
          href={href}
          className="shrink-0 tracking-tight hover:opacity-90"
          aria-label={`공지 상세: ${notice.title}`}
        >
          &gt;&gt;&gt;
        </Link>
      </div>
    </div>
  )
}

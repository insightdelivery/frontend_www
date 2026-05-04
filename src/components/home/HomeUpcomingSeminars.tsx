'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useSeminarHome } from '@/components/home/SeminarHomeContext'
import type { PublicVideoListItem } from '@/types/video'
import { CONTENT_CARD_HOVER_ZOOM_CLASS } from '@/components/article/articleBadges'

const PLACEHOLDER =
  'bg-gradient-to-br from-violet-200 via-violet-400 to-violet-800'

/** 목록에 일정 필드가 없을 때 D-day 미표시 — ISO가 오늘 이후일 때만 */
function ddayLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return null
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(t)
  end.setHours(0, 0, 0, 0)
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-DAY'
  return null
}

function formatKoDateTimeLine(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const wd = weekdays[d.getDay()]
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${y}.${m}.${day} (${wd}) ${hh}:${mm}`
  } catch {
    return ''
  }
}

function metaLine(item: PublicVideoListItem): string {
  const dt = formatKoDateTimeLine(item.createdAt)
  const extra = item.subtitle?.trim() || '외 1명'
  return dt ? `${extra} | ${dt}` : extra
}

function UpcomingSeminarCard({ item }: { item: PublicVideoListItem }) {
  const dday = ddayLabel(item.createdAt) ?? ddayLabel(item.updatedAt)
  const href = `/seminar/detail?id=${item.id}`

  return (
    <Link
      href={href}
      className="group flex flex-col gap-6 rounded-[12px] border border-solid border-[#e5e7eb] bg-white p-[25px] transition-colors hover:border-gray-300 sm:flex-row sm:items-center sm:gap-6"
    >
      {/* 세미나 썸네일 공통 16:9 — sm에서 높이 104px 기준 너비 = 104 * 16/9 */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-[8px] bg-[#f3f4f6] sm:h-[104px] sm:w-[calc(104px*16/9)] sm:aspect-auto">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt=""
            className={`h-full w-full object-cover ${CONTENT_CARD_HOVER_ZOOM_CLASS}`}
          />
        ) : (
          <div
            className={`h-full min-h-[120px] w-full sm:min-h-0 ${PLACEHOLDER} ${CONTENT_CARD_HOVER_ZOOM_CLASS}`}
          />
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-row items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-bold uppercase leading-[20px] text-[#ea90ff]">
                next seminar
              </span>
              {dday ? (
                <span className="rounded-[8px] bg-[#f3f4f6] px-2 py-0.5 text-[12px] font-normal leading-4 text-[#4b5563]">
                  {dday}
                </span>
              ) : null}
            </div>
          </div>
          <div className="pb-2">
            <h3 className="text-[16px] font-medium leading-6 text-[#202020] group-hover:underline line-clamp-2">
              {item.title}
            </h3>
          </div>
          {item.speaker ? (
            <div className="pb-1">
              <p className="text-[14px] font-normal leading-[20px] text-[#6b7280]">{item.speaker}</p>
            </div>
          ) : null}
          <div className="opacity-70">
            <p className="text-[12px] font-normal leading-4 text-[#6b7280]">{metaLine(item)}</p>
          </div>
        </div>
        <div className="flex shrink-0 self-center pt-1 sm:pt-0" aria-hidden>
          <ChevronRight
            className="h-[20px] w-[20px] text-[#cbd5e1] transition-colors group-hover:text-[#94a3b8]"
            strokeWidth={1.75}
          />
        </div>
      </div>
    </Link>
  )
}

/**
 * Figma node 1:260 — 히어로 직후 · 단일 가로형 카드
 * https://www.figma.com/design/faaPr93HWq1MitjeIhWdrO/...?node-id=1-260
 */
export default function HomeUpcomingSeminars() {
  const { upcoming, loading } = useSeminarHome()
  const featured = upcoming[0]

  return (
    <section className="mt-10 flex flex-col gap-[22px]">
      {/* Figma 1:261~264 — 제목 + 네온 점 (더보기 없음) */}
      <div className="flex w-full items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-[24px] font-bold leading-[32px] text-black">다가오는 세미나</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[120px] animate-pulse flex-col gap-6 rounded-[12px] border border-[#e5e7eb] bg-white p-[25px] sm:flex-row sm:items-center">
          <div className="aspect-[16/9] w-full rounded-[8px] bg-gray-200 sm:h-[104px] sm:w-[calc(104px*16/9)] sm:aspect-auto" />
          <div className="flex flex-1 flex-col justify-center gap-2">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-6 w-full max-w-lg rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
          <div className="hidden w-5 shrink-0 sm:block" />
        </div>
      ) : !featured ? (
        <p className="text-sm text-[#6b7280]">예정된 세미나가 없습니다.</p>
      ) : (
        <UpcomingSeminarCard item={featured} />
      )}
    </section>
  )
}

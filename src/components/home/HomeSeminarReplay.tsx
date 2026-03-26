'use client'

import Link from 'next/link'
import { useSeminarHome } from '@/components/home/SeminarHomeContext'
import { useSysCodeCategoryLabel } from '@/hooks/useSysCodeCategoryLabel'
import { SEMINAR_CATEGORY_PARENT } from '@/lib/syscode'

/** `HomeLatestVideos`와 동일 — 재생 오버레이·카테고리 뱃지·16:9 */
const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-800',
  'bg-gradient-to-br from-teal-200 via-teal-400 to-teal-800',
  'bg-gradient-to-br from-cyan-200 via-cyan-400 to-cyan-800',
]

export default function HomeSeminarReplay() {
  const { replay, loading } = useSeminarHome()
  const categoryLabel = useSysCodeCategoryLabel(SEMINAR_CATEGORY_PARENT)

  return (
    <section className="mt-16 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-black text-[24px] leading-[32px]">세미나 다시보기</h2>
          <span className="h-2 w-2 rounded-full bg-[#ffdf38]" aria-hidden />
        </div>
        <Link href="/seminar" className="font-medium text-[#6b7280] text-[14px] hover:text-black">
          더보기 &gt;
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-[8px] border border-[#e5e7eb] bg-gray-100 aspect-[16/9] min-h-[180px]"
            />
          ))}
        </div>
      ) : replay.length === 0 ? (
        <p className="text-sm text-[#6b7280]">다시보기로 노출할 세미나가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {replay.map((v, i) => (
            <Link key={v.id} href={`/seminar/detail?id=${v.id}`}>
              <div className="group">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className={`absolute inset-0 ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]}`} />
                  )}
                  <span className="absolute left-3 top-3 z-[1] rounded-[8px] bg-[#e1f800] px-2 py-1 font-bold text-black text-[10px] max-w-[85%] truncate">
                    {categoryLabel(v.category) || v.category?.trim() || '세미나'}
                  </span>
                  <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/20 backdrop-blur-[2px] text-white">
                      ▶
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 font-bold text-black text-[18px] leading-[24.75px] group-hover:underline">
                  {v.title}
                </p>
                {v.speaker ? (
                  <p className="mt-1 font-normal text-[#6b7280] text-[12px] leading-[16px]">{v.speaker}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

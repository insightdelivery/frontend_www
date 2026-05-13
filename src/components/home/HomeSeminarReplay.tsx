'use client'

import Link from 'next/link'
import { useSeminarHome } from '@/components/home/SeminarHomeContext'
import { useSysCodeCategoryLabel } from '@/hooks/useSysCodeCategoryLabel'
import { SEMINAR_CATEGORY_PARENT } from '@/lib/syscode'
import {
  editorialCardLift,
  editorialCatBadge,
  editorialSectionHeadBorder,
  editorialThumbHover,
} from '@/components/home/editorialClasses'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-emerald-800 via-emerald-900 to-neutral-950',
  'bg-gradient-to-br from-teal-800 via-teal-900 to-neutral-950',
  'bg-gradient-to-br from-cyan-800 via-cyan-900 to-neutral-950',
]

export default function HomeSeminarReplay() {
  const { replay, loading } = useSeminarHome()
  const categoryLabel = useSysCodeCategoryLabel(SEMINAR_CATEGORY_PARENT)

  return (
    <section className="pt-11 pb-8 max-sm:pt-10">
      <div className={`flex flex-row items-start justify-between gap-4 ${editorialSectionHeadBorder}`}>
        <h2 className="m-0 min-w-0 flex-1 text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-ink-900">
          세미나 다시보기
        </h2>
        <Link
          href="/seminar"
          className="group inline-flex shrink-0 items-center gap-1.5 self-start text-[14px] text-ink-500 transition-colors hover:text-ink-900"
        >
          더보기
          <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video w-full bg-cream-2" />
              <div className="mt-3 h-5 w-[70%] rounded-[3px] bg-ink-100" />
            </div>
          ))}
        </div>
      ) : replay.length === 0 ? (
        <p className="mt-10 text-[16px] text-ink-500">다시보기로 노출할 세미나가 없습니다.</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {replay.map((v, i) => (
            <Link key={v.id} href={`/seminar/detail?id=${v.id}`} className={`group block ${editorialCardLift}`}>
              <div className="relative mb-3 aspect-video w-full overflow-hidden bg-ink-700">
                {v.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover ${editorialThumbHover}`}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]} ${editorialThumbHover}`}
                  />
                )}
                <span className={editorialCatBadge}>
                  {categoryLabel(v.category) || v.category?.trim() || '세미나'}
                </span>
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[60%] to-black/45"
                  aria-hidden
                />
                <div
                  className="absolute bottom-4 left-4 z-[2] grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink-900 shadow-sm"
                  aria-hidden
                >
                  <span className="ml-0.5 block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-ink-900" />
                </div>
              </div>
              <h3 className="m-0 text-[20px] font-extrabold leading-[1.35] tracking-[-0.02em] text-ink-900">{v.title}</h3>
              {v.speaker ? <p className="mt-2 text-[16px] leading-[1.55] text-ink-500">{v.speaker}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

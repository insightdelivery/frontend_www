'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchPublicVideoList } from '@/services/video'
import type { PublicVideoListItem } from '@/types/video'
import { useSysCodeCategoryLabel } from '@/hooks/useSysCodeCategoryLabel'
import { VIDEO_CATEGORY_PARENT } from '@/lib/syscode'
import { videoDetailPath } from '@/lib/contentDetailRoutes'
import {
  editorialCardLift,
  editorialCatBadge,
  editorialSectionHeadBorder,
  editorialThumbHover,
} from '@/components/home/editorialClasses'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-emerald-800 via-emerald-900 to-neutral-950',
  'bg-gradient-to-br from-teal-800 via-teal-900 to-neutral-950',
]

/** 모바일 가로 카드 폭 — 다음 카드가 살짝 보이도록 */
const MOBILE_CARD_WIDTH_CLASS = 'w-[min(300px,calc(100vw-4.5rem))] min-w-[240px] max-w-[300px] shrink-0 snap-start'

function VideoCardBody({
  v,
  i,
  cat,
  secondLine,
  variant,
}: {
  v: PublicVideoListItem
  i: number
  cat: string
  secondLine: string
  variant: 'mobile' | 'desktop'
}) {
  const thumb = (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-ink-700 ${variant === 'desktop' ? 'md:rounded-none' : ''}`}
    >
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
      <span className={`${editorialCatBadge} !rounded-none`}>{cat}</span>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[60%] to-black/45"
        aria-hidden
      />
      <div
        className={`absolute z-[2] grid h-10 w-10 place-items-center rounded-none bg-white/95 text-ink-900 shadow-sm ${
          variant === 'mobile'
            ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'bottom-4 left-4'
        }`}
        aria-hidden
      >
        <span className="ml-0.5 block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-ink-900" />
      </div>
    </div>
  )

  if (variant === 'mobile') {
    return (
      <>
        <div className="overflow-hidden">{thumb}</div>
        <div className="bg-paper px-3 py-3">
          <h3 className="m-0 line-clamp-2 text-[16px] font-bold leading-snug tracking-tight text-ink-900">{v.title}</h3>
          {secondLine ? (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{secondLine}</p>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-3">{thumb}</div>
      <h3 className="m-0 text-[20px] font-extrabold leading-[1.35] tracking-[-0.02em] text-ink-900">{v.title}</h3>
      {secondLine ? <p className="mt-2 text-[16px] leading-[1.55] text-ink-500">{secondLine}</p> : null}
    </>
  )
}

export default function HomeLatestVideos() {
  const [items, setItems] = useState<PublicVideoListItem[]>([])
  const [loading, setLoading] = useState(true)
  const categoryLabel = useSysCodeCategoryLabel(VIDEO_CATEGORY_PARENT)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPublicVideoList({
        page: 1,
        pageSize: 8,
        sort: 'latest',
        contentType: 'video',
      })
      setItems((res.videos ?? []).slice(0, 8))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="pt-0 pb-12 max-sm:pt-10 max-sm:pb-16">
      <div className={`flex flex-row items-end justify-between gap-4 ${editorialSectionHeadBorder}`}>
        <div className="min-w-0 flex-1">
          <span className="mb-3 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
            VIDEO
          </span>
          <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-ink-900">최신 비디오</h2>
        </div>
        <Link
          href="/video"
          className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] text-ink-500 transition-colors hover:text-ink-900"
        >
          전체 영상
          <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      {loading ? (
        <>
          <div className="mt-10 -mx-5 flex gap-4 overflow-x-auto overflow-y-hidden px-5 pb-2 scrollbar-hide [scrollbar-width:none] snap-x snap-mandatory scroll-smooth sm:hidden [&::-webkit-scrollbar]:hidden">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={`sk-m-${i}`}
                className={`${MOBILE_CARD_WIDTH_CLASS} animate-pulse overflow-hidden border border-ink-100 bg-paper`}
              >
                <div className="aspect-video w-full bg-cream-2" />
                <div className="space-y-2 px-3 py-3">
                  <div className="h-4 w-[85%] rounded-none bg-ink-100" />
                  <div className="h-3 w-1/2 rounded-none bg-ink-100" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 hidden grid-cols-1 gap-6 sm:grid md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={`sk-d-${i}`} className="animate-pulse">
                <div className="aspect-video w-full bg-cream-2" />
                <div className="mt-3 h-6 w-[80%] rounded-none bg-ink-100" />
                <div className="mt-2 h-4 w-1/2 rounded-none bg-ink-100" />
              </div>
            ))}
          </div>
        </>
      ) : items.length === 0 ? (
        <p className="mt-10 text-[16px] text-ink-500">공개된 비디오가 없습니다.</p>
      ) : (
        <>
          <div className="mt-10 -mx-5 flex gap-4 overflow-x-auto overflow-y-hidden px-5 pb-2 scrollbar-hide [scrollbar-width:none] snap-x snap-mandatory scroll-smooth sm:hidden [&::-webkit-scrollbar]:hidden">
            {items.map((v, i) => {
              const cat = categoryLabel(v.category) || v.category?.trim() || '—'
              const secondLine = (v.subtitle || '').trim() || (v.speaker || '').trim()
              return (
                <Link
                  key={`m-${v.id}`}
                  href={videoDetailPath(v.id)}
                  className={`group block overflow-hidden border border-ink-100 bg-paper shadow-sm ${MOBILE_CARD_WIDTH_CLASS} ${editorialCardLift}`}
                >
                  <VideoCardBody v={v} i={i} cat={cat} secondLine={secondLine} variant="mobile" />
                </Link>
              )
            })}
          </div>
          <div className="mt-12 hidden grid-cols-1 gap-6 sm:grid md:grid-cols-2">
            {items.slice(0, 4).map((v, i) => {
              const cat = categoryLabel(v.category) || v.category?.trim() || '—'
              const secondLine = (v.subtitle || '').trim() || (v.speaker || '').trim()
              return (
                <Link key={`d-${v.id}`} href={videoDetailPath(v.id)} className={`group block ${editorialCardLift}`}>
                  <VideoCardBody v={v} i={i} cat={cat} secondLine={secondLine} variant="desktop" />
                </Link>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

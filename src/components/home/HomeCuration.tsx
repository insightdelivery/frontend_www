'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, FileText, Presentation, Video } from 'lucide-react'
import { fetchCurationHomeList, type CurationHomeItem } from '@/services/curation'
import { CONTENT_CARD_HOVER_ZOOM_CLASS } from '@/components/article/articleBadges'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700',
  'bg-gradient-to-br from-amber-200 via-amber-400 to-orange-600',
  'bg-gradient-to-br from-slate-300 via-slate-500 to-slate-700',
]

const PAGE_SIZE_DESKTOP = 3

function hrefForItem(item: CurationHomeItem): string {
  const id = encodeURIComponent(String(item.contentCode))
  if (item.contentType === 'ARTICLE') return `/article/detail?id=${id}`
  if (item.contentType === 'VIDEO') return `/video/detail?id=${id}`
  if (item.contentType === 'SEMINAR') return `/seminar/detail?id=${id}`
  return '/'
}

function TypeIcon({ type }: { type: string }) {
  const cls = 'h-3.5 w-3.5 text-white'
  if (type === 'VIDEO') return <Video className={cls} aria-hidden />
  if (type === 'SEMINAR') return <Presentation className={cls} aria-hidden />
  return <FileText className={cls} aria-hidden />
}

function CurationCard({ item, toneIdx }: { item: CurationHomeItem; toneIdx: number }) {
  const thumb = (item.thumbnail || '').trim()
  const href = hrefForItem(item)
  return (
    <Link href={href} className="group block min-w-0">
      <div className="relative overflow-hidden rounded-lg">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className={`aspect-video w-full object-cover ${CONTENT_CARD_HOVER_ZOOM_CLASS}`}
          />
        ) : (
          <div
            className={`aspect-video w-full ${PLACEHOLDER_GRADIENTS[toneIdx % PLACEHOLDER_GRADIENTS.length]} ${CONTENT_CARD_HOVER_ZOOM_CLASS}`}
          />
        )}
        {(item.categoryName || '').trim() ? (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-orange-400 px-2 py-1 text-xs text-white">
            {item.categoryName}
          </span>
        ) : null}
        <span
          className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          title={item.contentType}
        >
          <TypeIcon type={item.contentType} />
        </span>
      </div>
      <div className="mt-3">
        <h3 className="line-clamp-2 font-semibold text-[#202020] group-hover:underline">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.summary || '\u00a0'}</p>
      </div>
    </Link>
  )
}

export default function HomeCuration() {
  const [items, setItems] = useState<CurationHomeItem[]>([])
  const [heading, setHeading] = useState('특집')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchCurationHomeList()
      const list = res.items ?? []
      setItems(list)
      const name = res.curations?.[0]?.name?.trim()
      setHeading(name || '특집')
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const desktopPages = useMemo(() => Math.max(1, Math.ceil(items.length / PAGE_SIZE_DESKTOP)), [items.length])
  const desktopSlice = useMemo(() => {
    const start = page * PAGE_SIZE_DESKTOP
    return items.slice(start, start + PAGE_SIZE_DESKTOP)
  }, [items, page])

  useEffect(() => {
    setPage((p) => Math.min(p, desktopPages - 1))
  }, [desktopPages])

  if (!loading && items.length === 0) {
    return null
  }

  return (
    <section className="mt-10 flex flex-col gap-[22px]">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-black text-[24px] leading-[32px]">{heading}</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[#e5e7eb] bg-gray-100 aspect-video min-h-[120px]"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="md:hidden -mx-4 flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 pb-1 [scrollbar-width:thin]">
            {items.map((item, i) => (
              <div key={item.id} className="min-w-[80%] shrink-0 snap-start">
                <CurationCard item={item} toneIdx={i} />
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              aria-label="이전"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-800 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 gap-6 overflow-hidden">
              {desktopSlice.map((item, i) => (
                <div key={item.id} className="min-w-0 flex-1 basis-0">
                  <CurationCard item={item} toneIdx={page * PAGE_SIZE_DESKTOP + i} />
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="다음"
              disabled={page >= desktopPages - 1}
              onClick={() => setPage((p) => Math.min(desktopPages - 1, p + 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-800 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { fetchCurationHomeList, type CurationHomeItem } from '@/services/curation'
import {
  editorialCardLift,
  editorialCatBadge,
  editorialSectionHeadBorder,
  editorialThumbHover,
} from '@/components/home/editorialClasses'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { publicContentDetailPath } from '@/lib/contentDetailRoutes'

const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-stone-500 via-stone-600 to-stone-800',
  'bg-gradient-to-br from-amber-600 via-amber-700 to-stone-900',
  'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-800',
]

function hrefForItem(item: CurationHomeItem): string {
  if (item.contentType === 'ARTICLE' || item.contentType === 'VIDEO' || item.contentType === 'SEMINAR') {
    return publicContentDetailPath(item.contentType, item.contentCode)
  }
  return '/'
}

function ChoiceCard({ item, toneIdx }: { item: CurationHomeItem; toneIdx: number }) {
  const thumb = resolveArticleThumbnailUrl(item.thumbnail || null)
  const href = hrefForItem(item)
  return (
    <Link
      href={href}
      className={`choice-card group shrink-0 snap-start border border-ink-100 bg-paper transition-shadow duration-[250ms] [transition-timing-function:cubic-bezier(.2,.6,.2,1)] hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] max-sm:w-[80%] sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] ${editorialCardLift}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-2">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className={`h-full w-full object-cover ${editorialThumbHover}`} />
        ) : (
          <div className={`h-full w-full ${PLACEHOLDER_GRADIENTS[toneIdx % PLACEHOLDER_GRADIENTS.length]} ${editorialThumbHover}`} />
        )}
        {(item.categoryName || '').trim() ? <span className={editorialCatBadge}>{item.categoryName}</span> : null}
      </div>
      <div className="p-4">
        <h3 className="m-0 text-[20px] font-extrabold leading-[1.35] tracking-[-0.02em] text-ink-900">{item.title}</h3>
        <p className="mt-2 text-[16px] leading-[1.55] text-ink-500">{(item.summary || '').trim() || '\u00a0'}</p>
      </div>
    </Link>
  )
}

export default function HomeCuration() {
  const [items, setItems] = useState<CurationHomeItem[]>([])
  const [heading, setHeading] = useState('선택과 결정')
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchCurationHomeList()
      const list = res.items ?? []
      setItems(list)
      const name = res.curations?.[0]?.name?.trim()
      setHeading(name || '선택과 결정')
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const scrollByCard = useCallback((dir: -1 | 1) => {
    const el = gridRef.current
    if (!el) return
    const card = el.querySelector('.choice-card')
    if (!card) return
    const step = card.getBoundingClientRect().width + 24
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  if (!loading && items.length === 0) {
    return null
  }

  return (
    <section className="bg-cream py-10 max-sm:-mx-5 max-sm:px-5 max-sm:py-16 sm:px-6">
      <div className={`flex flex-row items-end justify-between gap-4 ${editorialSectionHeadBorder}`}>
        <div className="min-w-0 flex-1">
          <span className="mb-3 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
            SPECIAL SERIES
          </span>
          <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-ink-900">{heading}</h2>
        </div>
        <Link
          href="/article"
          className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] text-ink-500 transition-colors hover:text-ink-900"
        >
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex gap-6 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="min-h-[280px] min-w-[200px] flex-1 animate-pulse bg-ink-100/40" />
          ))}
        </div>
      ) : (
        <div className="relative mt-12">
          <div
            ref={gridRef}
            className="choice-grid flex gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-1 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          >
            {items.map((item, i) => (
              <ChoiceCard key={item.id} item={item} toneIdx={i} />
            ))}
          </div>
          <button
            type="button"
            className="absolute left-0 top-1/2 z-[5] hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink-100 bg-paper text-ink-900 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-[background,color,border-color] hover:border-ink-900 hover:bg-ink-900 hover:text-white active:scale-95 sm:flex md:h-11 md:w-11"
            aria-label="이전"
            onClick={() => scrollByCard(-1)}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="absolute right-0 top-1/2 z-[5] hidden h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink-100 bg-paper text-ink-900 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-[background,color,border-color] hover:border-ink-900 hover:bg-ink-900 hover:text-white active:scale-95 sm:flex md:h-11 md:w-11"
            aria-label="다음"
            onClick={() => scrollByCard(1)}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}

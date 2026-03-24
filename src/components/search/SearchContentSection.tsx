'use client'

import { useEffect, useState } from 'react'
import type { SearchContentItem, SearchContentKind } from '@/types/search'
import SearchContentCard from '@/components/search/SearchContentCard'

type Props = {
  title: string
  kind: SearchContentKind
  items: SearchContentItem[]
}

export default function SearchContentSection({ title, kind, items }: Props) {
  const [visibleCount, setVisibleCount] = useState(5)

  useEffect(() => {
    setVisibleCount(5)
  }, [items])

  const slice = items.slice(0, visibleCount)

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900">
        {title} <span className="text-gray-500">{items.length}</span>
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {slice.map((item) => (
          <SearchContentCard key={`${kind}-${item.id}`} item={item} kind={kind} />
        ))}
      </div>
      {items.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((p) => p + 10)}
          className="mt-4 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-200"
        >
          더보기
        </button>
      ) : null}
    </section>
  )
}

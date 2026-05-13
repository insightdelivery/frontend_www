'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSysCode, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'

/** 메인·`/article` — sysCode 기반 카테고리 pill */
export function ArticleCategoryPills() {
  const [categories, setCategories] = useState<SysCodeItem[]>([])

  useEffect(() => {
    void getSysCode(ARTICLE_CATEGORY_PARENT).then((list) => setCategories(list ?? []))
  }, [])

  const chipBase =
    'inline-flex h-8 items-center rounded-full border border-ink-100 bg-paper px-[14px] text-[13px] font-semibold text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900'

  return (
    <section id="categories" className="pt-12 pb-11 max-sm:pt-10">
      <div className="mb-3">
        <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-ink-900">아티클 카테고리</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-2 border-y border-ink-100 py-4">
        <Link href="/article/category?category=all" className={chipBase}>
          전체
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.sysCodeSid}
            href={`/article/category?category=${encodeURIComponent(cat.sysCodeSid)}`}
            className={chipBase}
          >
            {cat.sysCodeName}
          </Link>
        ))}
      </div>
    </section>
  )
}

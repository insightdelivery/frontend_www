'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSysCode, ARTICLE_CATEGORY_PARENT } from '@/lib/syscode'
import type { SysCodeItem } from '@/lib/syscode'

/** `/article` 페이지와 동일: sysCode 기반 아티클 카테고리 pill + `/article/category` 링크 */
export function ArticleCategoryPills() {
  const [categories, setCategories] = useState<SysCodeItem[]>([])

  useEffect(() => {
    void getSysCode(ARTICLE_CATEGORY_PARENT).then((list) => setCategories(list ?? []))
  }, [])

  return (
    <section className="mt-10 sm:mt-14">
      <h2 className="mb-4 text-[18px] font-black text-gray-800 sm:text-[20px]">아티클 카테고리</h2>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/article/category?category=all"
          className="inline-flex rounded-full border border-gray-200 px-4 py-2.5 text-[13px] font-bold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:text-[14px]"
        >
          전체
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.sysCodeSid}
            href={`/article/category?category=${encodeURIComponent(cat.sysCodeSid)}`}
            className="inline-flex rounded-full border border-gray-200 px-4 py-2.5 text-[13px] font-bold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:text-[14px]"
          >
            {cat.sysCodeName}
          </Link>
        ))}
      </div>
    </section>
  )
}

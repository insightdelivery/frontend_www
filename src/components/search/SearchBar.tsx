'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { normalizeSearchQuery } from '@/lib/searchQuery'

type Props = {
  defaultValue: string
}

export default function SearchBar({ defaultValue }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const submit = () => {
    const q = normalizeSearchQuery(value)
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit()
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex w-full max-w-xl gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="검색어를 입력하세요"
          className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
      >
        검색
      </button>
    </form>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { SITE_SHELL_MAX_CLASS } from '@/lib/siteLayoutWidth'

export default function TopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(typeof window !== 'undefined' && window.scrollY > 200)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 sm:px-6 md:px-8">
      <div className={`pointer-events-none relative w-full ${SITE_SHELL_MAX_CLASS}`}>
        <button
          type="button"
          aria-label="맨 위로"
          className="pointer-events-auto absolute right-0 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-md transition-opacity duration-200 hover:scale-105"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronUp className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

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
    <button
      type="button"
      aria-label="맨 위로"
      className="fixed bottom-20 right-6 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-md transition-opacity duration-200 hover:scale-105"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ChevronUp className="h-5 w-5" aria-hidden />
    </button>
  )
}

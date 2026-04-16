'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { useSeminarWwwEnabled } from '@/hooks/useSeminarWwwEnabled'

const SEMINAR_CLOSED_TOOLTIP = '추후 공개 예정입니다. 조금만 기다려 주세요!'

type GnbSeminarLinkProps = {
  isActive: boolean
  className?: string
  /** 비활성(툴팁)일 때 래퍼 — 모바일은 `block w-full` 권장 */
  wrapperClassName?: string
  /** 모바일 드로어 등 — 링크 이동 시에만 호출 */
  onNavigate?: () => void
}

export default function GnbSeminarLink({
  isActive,
  className = '',
  wrapperClassName = 'inline-block',
  onNavigate,
}: GnbSeminarLinkProps) {
  const enabled = useSeminarWwwEnabled()
  const [tipOpen, setTipOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipId = useId()

  useEffect(() => {
    if (!tipOpen) return
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setTipOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [tipOpen])

  const merged = `${className} transition-opacity hover:opacity-70 ${
    isActive ? 'underline underline-offset-4' : ''
  }`.trim()

  if (enabled) {
    return (
      <Link href="/seminar" className={merged} onClick={onNavigate}>
        세미나
      </Link>
    )
  }

  return (
    <div ref={wrapRef} className={`relative ${wrapperClassName}`}>
      <button
        type="button"
        className={`${merged} cursor-pointer border-0 bg-transparent p-0 font-bold text-inherit`}
        aria-expanded={tipOpen}
        aria-describedby={tipOpen ? tipId : undefined}
        onClick={() => setTipOpen((v) => !v)}
      >
        세미나
      </button>
      {tipOpen && (
        <div
          id={tipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-[200] mt-2 w-max max-w-[280px] -translate-x-1/2 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-gray-800 shadow-lg"
        >
          {SEMINAR_CLOSED_TOOLTIP}
        </div>
      )}
    </div>
  )
}

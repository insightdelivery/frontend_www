'use client'

import { useEffect, useState } from 'react'
import {
  ensureSysCodeLoaded,
  isSeminarWwwFeatureEnabledFromCache,
} from '@/lib/syscode'

const CACHE_KEY = 'sysCodeData'

/**
 * `SYS26416B001` 시스코드 기준 세미나 메뉴·메인 블록 공개 여부 (`sysCodeValue` !== `N`).
 */
export function useSeminarWwwEnabled(): boolean {
  const [enabled, setEnabled] = useState(() =>
    typeof window === 'undefined' ? true : isSeminarWwwFeatureEnabledFromCache()
  )

  useEffect(() => {
    let alive = true
    const refresh = () => {
      if (alive) setEnabled(isSeminarWwwFeatureEnabledFromCache())
    }
    refresh()
    void ensureSysCodeLoaded().then(refresh)
    const onStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      alive = false
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return enabled
}

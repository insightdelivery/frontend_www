'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SysCodeItem } from '@/lib/syscode'
import { getSysCode, getSysCodeName } from '@/lib/syscode'

/**
 * 시스템 코드 부모 SID로 하위 목록을 로드하고, category SID → 표시명 치환.
 * (`video/detail.md` §2.2 — 비디오/세미나 부모별로 훅 인자만 바꿔 사용)
 */
export function useSysCodeCategoryLabel(parentSysCodeGubn: string) {
  const [codes, setCodes] = useState<SysCodeItem[]>([])

  useEffect(() => {
    void getSysCode(parentSysCodeGubn).then(setCodes)
  }, [parentSysCodeGubn])

  return useCallback(
    (sid: string | null | undefined) => {
      const s = sid?.trim() ?? ''
      if (!s) return ''
      return getSysCodeName(codes, s) || s
    },
    [codes],
  )
}

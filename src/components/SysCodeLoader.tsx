'use client'

import { useEffect } from 'react'
import { ensureSysCodeLoaded } from '@/lib/syscode'

/**
 * 홈페이지 어디든 접속 시 localStorage에 sysCodeData가 없으면
 * 로그인 시와 동일한 syscode를 로드하여 항상 들어가 있도록 함.
 */
export default function SysCodeLoader() {
  useEffect(() => {
    ensureSysCodeLoaded()
  }, [])
  return null
}

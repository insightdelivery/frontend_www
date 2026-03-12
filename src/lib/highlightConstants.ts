/**
 * 하이라이트 상수 (articleHightlightPlan.md 15.13)
 * sysCodeData 내 SYS26312B001 하위에서 조회. 없으면 기본값 사용.
 */
import { getSysCodeFromCache } from '@/lib/syscode'
import { ARTICLE_HIGHLIGHT_PARENT } from '@/lib/syscode'
import type { HighlightConstants } from '@/types/highlight'

const DEFAULT_MAX_LENGTH = 500
const DEFAULT_COLORS = ['yellow', 'green', 'blue', 'pink']

/** SYS26312B005 = 최대 글자 수, SYS26312B006 = 컬러 레코드(sysCodeVal, sysCodeVal1~4) */
export function getHighlightConstants(): HighlightConstants {
  const list = getSysCodeFromCache(ARTICLE_HIGHLIGHT_PARENT)
  let maxLength = DEFAULT_MAX_LENGTH
  const colors: string[] = []

  if (list?.length) {
    const maxItem = list.find((c) => c.sysCodeSid === 'SYS26312B005')
    if (maxItem?.sysCodeValue) {
      const n = parseInt(maxItem.sysCodeValue, 10)
      if (!Number.isNaN(n)) maxLength = n
    }
    const colorRecord = list.find((c) => c.sysCodeSid === 'SYS26312B006')
    if (colorRecord) {
      const rec = colorRecord as unknown as Record<string, unknown>
      const val = rec.sysCodeValue ?? rec.sysCodeVal
      if (typeof val === 'string' && val) colors.push(val)
      for (let i = 1; i <= 4; i++) {
        const v = rec[`sysCodeVal${i}`]
        if (typeof v === 'string' && v) colors.push(v)
      }
    }
  }

  return {
    maxLength: maxLength > 0 ? maxLength : DEFAULT_MAX_LENGTH,
    colors: colors.length ? colors : DEFAULT_COLORS,
  }
}

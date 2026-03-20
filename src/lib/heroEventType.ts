/**
 * Hero 슬라이드용 eventTypeCode(sysCodeSid) 결정 (eventBannerPlan §11.1)
 * - NEXT_PUBLIC_HERO_EVENT_TYPE_CODE 가 있으면 최우선
 * - 없으면 부모 SYS26320B003 하위 목록에서 이름 기준으로 메인 배너 유형 추론
 */
import { DISPLAY_EVENT_TYPE_PARENT, fetchSysCodeByParent, type SysCodeItem } from '@/lib/syscode'

function pickMainHeroEventSid(list: SysCodeItem[]): string | null {
  const active = list
    .filter((c) => c.sysCodeUseFlag === 'Y' && c.sysCodeSid)
    .sort((a, b) => a.sysCodeSort - b.sysCodeSort || a.sysCodeName.localeCompare(b.sysCodeName, 'ko'))

  if (!active.length) return null

  const norm = (s: string) => s.trim().replace(/\s+/g, '')
  const mainBanner = active.find((c) => /메인\s*베너|메인배너/i.test(norm(c.sysCodeName)))
  const mainAny = active.find((c) => c.sysCodeName.includes('메인'))

  return (mainBanner ?? mainAny ?? active[0]).sysCodeSid
}

export async function resolveHeroEventTypeCode(): Promise<string | null> {
  const env = (process.env.NEXT_PUBLIC_HERO_EVENT_TYPE_CODE || '').trim()
  if (env) return env

  const list = await fetchSysCodeByParent(DISPLAY_EVENT_TYPE_PARENT)
  return pickMainHeroEventSid(list)
}

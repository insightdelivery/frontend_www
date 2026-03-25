import api from '@/lib/api'
import type { DisplayEventHeroItem } from '@/types/displayEvent'

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

/**
 * Hero 전용 — 단일 호출로 슬라이드 데이터 (eventBannerPlan)
 * @param eventTypeCode sysCodeSid (예: HERO용 부모 하위 코드)
 */
export async function fetchHeroDisplayEvents(eventTypeCode: string): Promise<DisplayEventHeroItem[]> {
  if (!eventTypeCode.trim()) return []
  const { data } = await api.get('/api/events', {
    params: { eventTypeCode: eventTypeCode.trim() },
  })
  const wrap = data as { IndeAPIResponse?: { ErrorCode?: string } }
  if (wrap?.IndeAPIResponse?.ErrorCode && wrap.IndeAPIResponse.ErrorCode !== '00') {
    return []
  }
  const raw = unwrapResult<unknown>(data)
  return Array.isArray(raw) ? (raw as DisplayEventHeroItem[]) : []
}

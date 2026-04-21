/**
 * 사이트 방문 이벤트 기록 (siteInputDataPlan.md) — POST public_api
 */
import apiClient from '@/lib/axios'

export async function postSiteVisit(payload: { visitorKey: string; path: string }): Promise<void> {
  await apiClient.post('/api/site-visits', {
    visitorKey: payload.visitorKey,
    path: payload.path,
  })
}

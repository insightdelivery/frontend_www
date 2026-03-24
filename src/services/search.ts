import api from '@/lib/api'
import type { UnifiedSearchResult } from '@/types/search'

const BASE = '/api/search'

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

export async function fetchUnifiedSearch(
  q: string,
  signal?: AbortSignal
): Promise<UnifiedSearchResult> {
  const { data } = await api.get(`${BASE}/`, {
    params: { q },
    signal,
  })
  return unwrapResult<UnifiedSearchResult>(data)
}

import api from '@/lib/api'

const LIST_URL = '/api/curation/list'

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

export type CurationHomeItem = {
  id: number
  title: string
  thumbnail: string
  categoryName: string
  summary: string
  contentType: 'ARTICLE' | 'VIDEO' | 'SEMINAR'
  contentCode: number
}

export type CurationHomeBlock = {
  curationId: number
  name: string
  items: CurationHomeItem[]
}

export type CurationHomeListResult = {
  curations: CurationHomeBlock[]
  items: CurationHomeItem[]
}

/** 메인 §5 — 공개 큐레이션(노출 조건 통과) 목록 */
export async function fetchCurationHomeList(): Promise<CurationHomeListResult> {
  const { data } = await api.get(LIST_URL)
  const raw = unwrapResult<CurationHomeListResult>(data)
  return {
    curations: raw.curations ?? [],
    items: raw.items ?? [],
  }
}

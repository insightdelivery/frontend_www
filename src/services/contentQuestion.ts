import api from '@/lib/api'

export type ContentType = 'ARTICLE' | 'VIDEO' | 'SEMINAR'

export interface ContentQuestionItem {
  question_id: number
  question_text: string
  sort_order: number
}

function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

/** 콘텐츠별 질문 목록 조회 (공개) */
export async function fetchContentQuestions(
  contentType: ContentType,
  contentId: number | string
): Promise<ContentQuestionItem[]> {
  const id = typeof contentId === 'string' ? parseInt(contentId, 10) : contentId
  if (Number.isNaN(id)) return []
  const { data } = await api.get(`/api/content/${contentType}/${id}/questions/`)
  const result = unwrapResult<ContentQuestionItem[]>(data)
  return Array.isArray(result) ? result : []
}

export interface SubmitQuestionAnswerPayload {
  question_id: number
  content_type: ContentType
  content_id: number
  answer_text: string
}

/** 질문 답변 등록 (로그인 사용자; user_id는 백엔드에서 토큰으로 추출 가능 시 생략) */
export async function submitQuestionAnswer(
  payload: SubmitQuestionAnswerPayload
): Promise<{ answer_id: number; question_id: number }> {
  const { data } = await api.post('/api/content/question-answer/', payload)
  return unwrapResult(data)
}

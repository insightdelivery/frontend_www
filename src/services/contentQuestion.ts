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
  const { data } = await api.get(`/api/content/${contentType}/${id}/questions`)
  const result = unwrapResult<ContentQuestionItem[]>(data)
  return Array.isArray(result) ? result : []
}

export interface SubmitQuestionAnswerPayload {
  question_id: number
  content_type: ContentType
  content_id: number
  answer_text: string
}

/** 질문 답변 등록 (로그인 필수 — axios가 `POST /api/content/question-answer`에 Bearer 첨부) */
export async function submitQuestionAnswer(
  payload: SubmitQuestionAnswerPayload
): Promise<{ answer_id: number; question_id: number }> {
  const { data } = await api.post('/api/content/question-answer', payload)
  return unwrapResult(data)
}

export interface MyContentAnswerItem {
  answer_id: number
  question_id: number
  answer_text: string
}

/** 로그인 사용자의 해당 콘텐츠 답변 목록 (`GET .../my-answers`) */
export async function fetchMyContentAnswers(
  contentType: ContentType,
  contentId: number | string
): Promise<MyContentAnswerItem[]> {
  const id = typeof contentId === 'string' ? parseInt(contentId, 10) : contentId
  if (Number.isNaN(id)) return []
  const { data } = await api.get(`/api/content/${contentType}/${id}/my-answers`)
  const result = unwrapResult<MyContentAnswerItem[]>(data)
  return Array.isArray(result) ? result : []
}

export async function updateQuestionAnswer(
  answerId: number,
  payload: { answer_text: string }
): Promise<{ answer_id: number; question_id: number }> {
  const { data } = await api.patch(`/api/content/question-answer/${answerId}`, payload)
  return unwrapResult(data)
}

export async function deleteQuestionAnswer(answerId: number): Promise<{ question_id: number }> {
  const { data } = await api.delete(`/api/content/question-answer/${answerId}`)
  return unwrapResult(data)
}

/** 마이페이지 적용질문 — 답변한 콘텐츠 목록 (GET /api/content/my-answered-contents) */
export interface MyAnsweredContentItem {
  contentType: ContentType
  contentTypeLabel: string
  contentId: number
  categoryName: string | null
  title: string
  subtitle?: string | null
  thumbnailUrl: string | null
  lastAnsweredAt: string | null
  answerCount: number
  contentUrl: string
}

export interface MyAnsweredContentsListResult {
  list: MyAnsweredContentItem[]
  total: number
  page: number
  page_size: number
}

export async function getMyAnsweredContents(params?: {
  page?: number
  page_size?: number
}): Promise<MyAnsweredContentsListResult> {
  const { data } = await api.get('/api/content/my-answered-contents', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 9,
    },
  })
  const out = unwrapResult<MyAnsweredContentsListResult>(data)
  if (out == null || !Array.isArray(out.list)) {
    throw new Error('목록 형식이 올바르지 않습니다.')
  }
  return out
}

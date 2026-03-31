import apiClient from '@/lib/axios'

const INDERESULT = 'IndeAPIResponse'
const RESULT = 'Result'

function unwrap<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  const wrap = d?.[INDERESULT] as Record<string, unknown> | undefined
  if (wrap && typeof wrap[RESULT] !== 'undefined') return wrap[RESULT] as T
  if (typeof d?.[RESULT] !== 'undefined') return d[RESULT] as T
  return d as T
}

function getMessage(data: unknown): string {
  const d = data as Record<string, unknown>
  const wrap = d?.[INDERESULT] as { Message?: string } | undefined
  return wrap?.Message ?? (d as { message?: string }).message ?? '처리 중 오류가 발생했습니다.'
}

export type CommentContentType = 'ARTICLE' | 'VIDEO' | 'SEMINAR'

export interface CommentUser {
  id: number
  nickname: string
  isAdmin: boolean
}

export interface CommentReplyItem {
  id: number
  user: CommentUser
  text: string
  created_at: string | null
  is_deleted: boolean
  is_admin_reply?: boolean
  is_mine?: boolean
  can_edit?: boolean
  can_delete?: boolean
}

export interface CommentItem extends CommentReplyItem {
  replies: CommentReplyItem[]
}

export interface CommentListResult {
  list: CommentItem[]
  total: number
}

export async function fetchComments(params: { contentType: CommentContentType; contentId: string | number }): Promise<CommentListResult> {
  const res = await apiClient.get('/api/comments', {
    params: { type: params.contentType, id: params.contentId },
  })
  const out = unwrap<CommentListResult>(res.data)
  if (!out?.list) throw new Error(getMessage(res.data))
  return out
}

export async function createComment(payload: {
  contentType: CommentContentType
  contentId: string | number
  commentText: string
  parentId?: number
}): Promise<{ id: number; depth: number }> {
  const res = await apiClient.post('/api/comments', {
    content_type: payload.contentType,
    content_id: payload.contentId,
    comment_text: payload.commentText,
    ...(payload.parentId ? { parent_id: payload.parentId } : {}),
  })
  const out = unwrap<{ id: number; depth: number }>(res.data)
  if (!out?.id) throw new Error(getMessage(res.data))
  return out
}

export async function updateComment(payload: { commentId: number; commentText: string }): Promise<void> {
  const res = await apiClient.patch(`/api/comments/${payload.commentId}`, {
    comment_text: payload.commentText,
  })
  const out = unwrap<{ id: number }>(res.data)
  if (!out?.id) throw new Error(getMessage(res.data))
}

export async function deleteComment(commentId: number): Promise<void> {
  const res = await apiClient.delete(`/api/comments/${commentId}`)
  const out = unwrap<{ id: number }>(res.data)
  if (!out?.id) throw new Error(getMessage(res.data))
}

